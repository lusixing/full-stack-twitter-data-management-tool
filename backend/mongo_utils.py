import pymongo
import datetime
import os

class Mongo_handler:
    def __init__(self, db_url:str, MQ) -> None:
        self.client = None
        self.MQ = MQ
        self.connection_state = None
        self.connection_msg = None
        self.connect(db_url)

    def connect(self,db_url):
        try:
            client = pymongo.MongoClient(db_url,serverSelectionTimeoutMS=2000)
            msg = client.server_info() 
            self.connection_state = 'success'
            self.connection_msg = msg
            self.client = client
        except Exception as E:
            self.connection_state = 'fail'
            self.connection_msg = E

    def create_tweet_user(self, data):
        tweet_user_profiles_test1 = self.client["tweet_db_test1"]['tweet_user_profiles_test1']
        data['tags'] = []
        if tweet_user_profiles_test1.count_documents({'id':data['id']})==0:
            res = tweet_user_profiles_test1.insert_one(data)
            return {'status':'insert one'}
        else:
            return {'status':'already exist'}    

    def update_tweet(self, user_id, data=None, media_info=None):
        tweet_data_collection =  self.client["tweet_db_test1"]['tweet_data_test1']
        if tweet_data_collection.count_documents({'id':str(user_id)})==0:
            display_name = self.id_to_dispaly_name(user_id)
            username = self.id_username_convert(id=user_id)['username']
            init_doc = {
                "name": display_name,
                "username":username,
                "id": str(user_id),
                "tags": [],
                "tweets":[],
                "media_keys":{},
                "date": datetime.datetime.utcnow()}
            tweet_data_collection.insert_one(init_doc)

        #update tweets
        tweets = tweet_data_collection.find({'id':user_id})[0]['tweets']
        old_tweets = set()
        N_tweets_updated = 0
        for record in tweets:
            old_tweets.add(record['id'])
        for item in data:
            if item['id'] not in old_tweets:
                #associate media type to tweets
                if "attachments" in item and "media_keys" in item["attachments"]:
                    if len(item["attachments"]["media_keys"]) >1:
                        item["media_type"] = "photo"
                    else:        
                        for media_item in media_info:
                            if media_item["media_key"] == item["attachments"]["media_keys"][0]:
                                item["media_type"] = media_item["type"]

                tweets.append(item)
                N_tweets_updated += 1
            else:
                print('skip tweet')    
    
        tweets.sort(key=lambda x:datetime.datetime.strptime(x['created_at'], "%Y-%m-%dT%H:%M:%S.%fZ"),reverse=True)

        myquery = {'id':user_id}
        newvalues = { "$set": { "tweets": tweets } }

        tweet_data_collection.update_one(myquery, newvalues)           
        return {'status':'ok','num_updated':N_tweets_updated}


    def get_user_profile(self, id=None, name=None):
        tweet_user_profiles = self.client["tweet_db_test1"]['tweet_user_profiles_test1']
        if id:
            query = {'id':id}
        elif name:
            query = {'username':name}    
        else:
            return {'status':'invalid parameter'}    
        cursor = tweet_user_profiles.find(query)
        res = list(cursor)
        if len(res)>0:
            return res[0]
        else:
            return {'status':'profile not found'}


    def get_user_tweets(self, id=None, name=None):
        tweet_data_collection =  self.client["tweet_db_test1"]['tweet_data_test1']
        if id:
            query = {'id':str(id)}
        elif name:
            query = {'username':str(name)}    
        else:
            return {'status':'invalid parameter'}    
        cursor = tweet_data_collection.find(query)
        res = list(cursor)
        if len(res)>0:
            return res[0]
        else:
            return {'status':'profile not found'}


    def fetch_all_profiles(self):
        tweet_user_profiles = self.client["tweet_db_test1"]['tweet_user_profiles_test1']
        cursor = tweet_user_profiles.find({})

        profiles = []
        for document in cursor:
            profiles.append(document)
        return {'profile_data':profiles}


    def edit_profile(self,username,new_tags):
        tweet_user_profiles = self.client["tweet_db_test1"]['tweet_user_profiles_test1']
        newvalues = { "$set": { 'tags': new_tags } }
 
        db_res = tweet_user_profiles.update_one({'username':username}, newvalues)
        return {'status':'success'}


    def id_username_convert(self,id = None, name = None):
        if (not id and not name) or (id and name):
            return {'status': 'invalid param'}
        
        tweet_user_profiles = self.client["tweet_db_test1"]['tweet_user_profiles_test1']
        if id:
            if tweet_user_profiles.count_documents({'id':str(id)})==0:
                return {'status':'id not exist'}
            username = tweet_user_profiles.find({'id':id})[0]['username']
            return {'status':'success', 'username':username}
        
        elif name:
            if tweet_user_profiles.count_documents({'username':str(name)})==0:
                return {'status':'username not exist'}
            id = tweet_user_profiles.find({'username':str(name)})[0]['id']
            return {'status':'success', 'id':id}


    def check_media_intregity(self, id, media_path):
        tweet_data_collection =  self.client["tweet_db_test1"]['tweet_data_test1']
        tweet_user_collection =  self.client["tweet_db_test1"]['tweet_user_profiles_test1']
        if id:
            query = {'id':str(id)}
        else:
            return {'status':'invalid parameter'}    
        cursor1 = tweet_data_collection.find(query)
        res1 = list(cursor1)
        cursor2 = tweet_user_collection.find(query)
        res2 = list(cursor2)

        if len(res1)>0:
            name = self.id_to_dispaly_name(id)
            #check profile
            profile_img_url = res2[0]['profile_image_url'].replace('normal','400x400')
            file_path = media_path+"\\"+name+"\\"+id+'.jpg'
            if not os.path.exists(file_path):
                profile_img_missing = profile_img_url
            else:
                profile_img_missing = None

            #check tweets media
            tweets = res1[0]['tweets']
            missing = []
            for tweet in tweets:
                if "media_type" in tweet:
                    for key in tweet['attachments']['media_keys']:
                        if tweet['media_type']=='photo':
                            file_path = media_path+"\\"+name+"\\"+key+'.jpg'
                        else:
                            file_path = media_path+"\\"+name+"\\"+key+'.mp4'    
                        if not os.path.exists(file_path):
                            missing.append(tweet['id'])
                            break
            if missing==[] and not profile_img_missing:
                return {'status':'ok'}
            else:
                return {'status':'missing','tweets_missing':missing, 'profile_url_missing':profile_img_missing}             
        else:
            return {'status':'id not exist'}


    def id_to_dispaly_name(self,id):
        tweet_user_profiles = self.client["tweet_db_test1"]['tweet_user_profiles_test1']
        display_name = tweet_user_profiles.find({'id':id})[0]['name']
        return display_name

