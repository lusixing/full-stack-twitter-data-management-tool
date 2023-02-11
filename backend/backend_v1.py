from flask import Flask, jsonify, request, send_from_directory

import tweet_utils
import mongo_utils


from bson.json_util import ObjectId
import json
from flask_cors import CORS

from queue import Queue
import os
import yaml
from multiprocessing.pool import ThreadPool

app = Flask(__name__)
cors = CORS(app)

MQ1 = Queue()

class MyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super(MyEncoder, self).default(obj)


class Backend:
    def __init__(self):
        self.mongo_handler = None
        self.tweets_handler = None

backend = Backend()


@app.route('/',methods = ['GET'])
def index():
    with open('backend_config.yaml') as f:
        configs = yaml.load(f, Loader=yaml.FullLoader)

    if configs['auth']:
        db_url = "mongodb://{}:{}@mongo:{}/".format(configs['username'],configs['password'],configs['port'])
    else:
        db_url = "mongodb://localhost:{}".format(configs['port'])

    print(db_url)
    mongo_handler = mongo_utils.Mongo_handler(db_url=db_url, MQ=MQ1)
    tweets_handler = tweet_utils.Twitter_handler(mongo_handler=mongo_handler, MQ=MQ1, media_folder=configs['media_path'], bearer_token=configs['bearer_token'])
    app.json_encoder = MyEncoder
    backend.mongo_handler = mongo_handler
    backend.tweets_handler = tweets_handler
    return {'status':'ready','msg': str(backend.mongo_handler.connection_msg),'debug':db_url}


@app.route('/dashboard',methods = ['GET'])
def dashboard():
    return {'status':backend.mongo_handler.connection_state,'msg': str(backend.mongo_handler.connection_msg)}


@app.route('/create_user', methods=['POST'])
def create_user_profile():
    username = request.get_json()['username']
    if username[0]=='@':
        username = username[1:]
    tw_res = backend.tweets_handler.get_user_profile_by_name(username)

    if 'error' not in tw_res:
        mongo_res = backend.mongo_handler.create_tweet_user(tw_res['data'][0])
        state = 'success'
        if mongo_res['status']=='insert one':
            info = 'success'
        else:
            info = 'already exist'    
    else:
        state = 'error'
        info = tw_res['error']
    return {'status':state,'info':str(info)}


@app.route('/claw_user_data', methods=['POST'])
def claw_user_data():
    req_data = request.get_json()
    username = req_data['username']
    only_recent = req_data['only_recent']
    update_all_users = req_data['update_all_users']

    N_tweets_updated = 0
    if not update_all_users:
        if len(username)>0 and username[0]=='@':
            username = username[1:]
        res = backend.mongo_handler.id_username_convert(name=username)
        if res['status']=='success':
            id = res['id']
        else:
            return {'status':res['status'], 'info':res['info']}    

        tw_res = backend.tweets_handler.get_user_data(user_id=id, paginate=(not only_recent))
        if tw_res['status']=='done':
            N_tweets_updated += tw_res['N_new_tweets']
        elif tw_res['status']=='fail':
            if 'error_info' in tw_res:
                return tw_res
            return {'status':'fail','error_info':'unknow' }    

    else:
        res = backend.mongo_handler.fetch_all_profiles()
        if 'profile_data' in res:
            pool = ThreadPool(10)
            for res in pool.starmap(backend.tweets_handler.get_user_data,[(item['id'], not only_recent) for item in res['profile_data']]):
                if res['status']=='done':
                    N_tweets_updated += res['N_new_tweets']
                elif ['status']=='fail':     
                    return res

        else:
            return {'status':'fail','info':'DB faliure'}          
    return {'status':'done','N_tweets_updated':N_tweets_updated}  



@app.route('/query_user', methods=[ 'POST'])
def query_user():
    req_form = request.get_json()
    if 'name' in req_form:
        username = req_form['name']
        id = None
    elif 'id' in req_form:
        id = req_form['id']         
        username = None
    else: 
        return {'status':'invalid param'}

    profile = backend.mongo_handler.get_user_profile(name=username,id=id)
    tweet_data = backend.mongo_handler.get_user_tweets(name=username,id=id)

    if 'tweets' in tweet_data:
        return {'status':'success','profile':profile,'tweet_data':tweet_data['tweets']}
    else:
        return {'status':'fail'}    

@app.route('/update_user_profile', methods=['POST'])
def update_user_profile():
    req_form = request.get_json()
    username,tags = req_form['username'],req_form['tags']
    mongo_res = backend.mongo_handler.edit_profile(username=username,new_tags=tags)
    return {'status':'success'}


@app.route('/read_mq', methods=['GET'])
def read_message_queue():
    msg = []
    while not MQ1.empty():
        msg.append(MQ1.get())
    res = {'status':'done','msg':msg}
    return res


@app.route('/get_all_profiles', methods=['GET'])
def show_users():
    user_profiles = backend.mongo_handler.fetch_all_profiles()
    return user_profiles


@app.route('/conn_state', methods=['GET'])
def get_conn_state():
    return {'msg': str(backend.mongo_handler.connection_msg)}


@app.route('/getfile/<path:file>')
def send_file(file):
    return send_from_directory('/flask-app1/static_media/', file)


if __name__ == "__main__":
    app.run(debug=True)


