import requests
import os
import traceback


auth = {'bearer_token':None}

class Twitter_handler:
    def __init__(self,mongo_handler,MQ,media_folder,bearer_token) -> None:
        self.mongo_handler = mongo_handler
        self.MQ = MQ
        self.media_folder = media_folder
        auth['bearer_token'] = bearer_token

    def get_user_profile_by_name(self,username):
        end_point = "https://api.twitter.com/2/users/by"
        params = {
            "usernames": username,
            "user.fields": "created_at,description,entities,id,location,name,pinned_tweet_id,profile_image_url,protected,public_metrics,url,username,verified,withheld",
        }

        try:
            json_response = self.connect_to_endpoint(end_point, params)
        except Exception as E:
            print(E)
            res = {"error": E}
            return res     
        name = json_response["data"][0]["name"]
        if not os.path.exists("{}/{}".format(self.media_folder,name)):
           os.makedirs("{}/{}".format(self.media_folder,name))


        profile_img_url = json_response["data"][0]["profile_image_url"].replace(
                "normal", "400x400"
            )
        id = json_response["data"][0]["id"]
        img_data = requests.get(profile_img_url).content
        with open("{}/{}/{}.jpg".format(self.media_folder,name,id), "wb") as handler:
                handler.write(img_data)

        return json_response

    def get_user_data(self, user_id, paginate=False):
        params = {
            "tweet.fields": "created_at,author_id,attachments",
            "expansions": "attachments.media_keys",
            "media.fields": "url,variants",
            "pagination_token": None,
        }
        end_point = "https://api.twitter.com/2/users/{}/tweets".format(user_id)

        pages = 0
        N_new_tweets = 0
        try:
            json_response = self.connect_to_endpoint(end_point, params)
            name = self.mongo_handler.id_to_dispaly_name(user_id)
            if "data" in json_response:
                if "includes" in json_response and "media" in json_response["includes"]:
                    media_info = json_response["includes"]["media"]
                    for item in media_info:
                        self.download_media(name, item)
                    db_res = self.mongo_handler.update_tweet(
                        user_id, data=json_response["data"], media_info=media_info
                    )
                else:
                    db_res = self.mongo_handler.update_tweet(user_id, data=json_response["data"])
                if db_res["status"] == "ok":
                    N_new_tweets += db_res["num_updated"]
                    self.MQ.put("Retrieved {} tweets from user: {}".format(N_new_tweets,name))
            elif 'errors' in json_response:    
                return {"status": "fail", "info": json_response['errors']}   

            if paginate:
                while (
                    "meta" in json_response
                    and "next_token" in json_response["meta"]
                    and len(json_response["meta"]["next_token"]) != 0
                ):
                    params["pagination_token"] = json_response["meta"]["next_token"]
                    json_response = self.connect_to_endpoint(end_point, params)
                    if "data" in json_response:
                        if (
                        "includes" in json_response
                        and "media" in json_response["includes"]
                        ):
                            media_info = json_response["includes"]["media"]
                            for item in json_response["includes"]["media"]:
                                self.download_media(name, item)
                            db_res = self.mongo_handler.update_tweet(
                                user_id, data=json_response["data"], media_info=media_info
                            )
                        else:
                            db_res = self.mongo_handler.update_tweet(
                                user_id, data=json_response["data"]
                            )
                    pages += 1
                    if db_res["status"] == "ok":
                        if db_res["num_updated"]>0:
                            N_new_tweets += db_res["num_updated"]
                            self.MQ.put("Retrieved {} tweets from user: {}".format(N_new_tweets,name))
                        else:
                            break    
                    print("Pages clawed: ", pages)

            return {"status": "done", "N_new_tweets": N_new_tweets}

        except Exception as E:
            res = {"status": "fail", "error_info": str(E)}
            return res

    def download_media(self, name, media_item):
        if not os.path.exists("{}/{}".format(self.media_folder,name)):
           os.makedirs("{}/{}".format(self.media_folder,name))

        if media_item["type"] == "photo":
            img_data = requests.get(media_item["url"]).content
            with open(
                "{}/{}/{}.jpg".format(self.media_folder,name, media_item["media_key"]) , "wb"   
            ) as handler:
                handler.write(img_data)

        elif media_item["type"] == "video":
            max_bit_rate, link = 0, ""
            for item in media_item["variants"]:
                if "bit_rate" in item and item["bit_rate"] > max_bit_rate:
                    max_bit_rate = item["bit_rate"]
                    link = item["url"]

            r = requests.get(link, stream=True)

            for i in range(len(media_item["variants"]) - 1, -1, -1):
                if media_item["variants"][i]["content_type"] == "video/mp4":
                    path = "{}/{}/{}.mp4".format(self.media_folder,name, media_item["media_key"])
                    with open(path, "wb") as f:
                        for chunk in r.iter_content(chunk_size=1024 * 1024):
                            if chunk:
                                f.write(chunk)
                    return {"status": "download successful"}
            return {"status": "media type problem"}


    def fix_missing_media(self, user_id):
        res = self.mongo_handler.check_media_intregity(user_id, "C:\\tmp_media")
        if res["status"] == "ok":
            return {"status": "no missing"}
        tweets_missing = res["tweets_missing"]
        profile_img_missing = res["profile_url_missing"]

        while tweets_missing != [] or profile_img_missing != None:
            if profile_img_missing != None:
                name = self.mongo_handler.id_to_dispaly_name(user_id)
                img_data = requests.get(profile_img_missing).content
                with open("{}/{}/{}.jpg".format(self.media_folder,name, user_id), "wb") as handler:    
                    handler.write(img_data)
                print('profile img fixed')
                profile_img_missing = None

            print("{} tweets media missing".format(len(tweets_missing)))
            if len(tweets_missing) > 0:
                for tweet_id in tweets_missing:
                    url = "https://api.twitter.com/2/tweets"
                    params = {
                    "ids": tweet_id,
                    "tweet.fields": "created_at,author_id,attachments",
                    "expansions": "attachments.media_keys",
                    "media.fields": "url,variants",
                    }
                    try:
                        json_response = self.connect_to_endpoint(url, params)
                        media_info = json_response["includes"]["media"]
                        for item in media_info:
                            self.download_media(user_id, item)

                    except Exception as E:
                        res = {"status": "fail", "error_info": E.args[0]}
                        return res
            res = self.mongo_handler.check_media_intregity(user_id, "C:\\tmp_media")
            if res["status"] != "ok":
                tweets_missing = res["tweets_missing"]
                profile_img_missing = res["profile_url_missing"]
            else:
                break
        return {"status": "done"}

    def bearer_oauth(self,r):
        """
        Method required by bearer token authentication.
        """
        r.headers["Authorization"] = f"Bearer {auth['bearer_token']}"
        r.headers["User-Agent"] = "v2UserTweetsPython"
        return r


    def connect_to_endpoint(self,url, params):
        response = requests.request("GET", url, auth=self.bearer_oauth, params=params)
        print(response.status_code)
        if response.status_code != 200:
            raise Exception(
            "Request returned an error: {} {}".format(
                response.status_code, response.text
            )
            )
        return response.json()

    







