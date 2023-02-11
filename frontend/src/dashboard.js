import React from 'react'

import SideMenu from './components/SideMenu';
import TopMenu from './components/TopMenu';
import DataPanel from './components/DataPanel'
import ControlPanel from './components/ControlPanel';
import UserPanel from './components/UserPanel';
import axios from 'axios';


class dashboard extends React.Component {
    constructor(props) {
        super(props);
        this.state = { curretWorkSpace:'dataPanel',
                        data_panel_param:{profile:{},tweet_data:[],active_tweets:[],current_page:1,N_pages:1},
                        MQ:[],
                        MQ_buffer:[]}

        this.switch_panel = this.switch_panel.bind(this)
        this.renderPanel = this.renderPanel.bind(this)
        this.set_data_panel_param = this.set_data_panel_param.bind(this)
        this.get_msg = this.get_msg.bind(this)
        this.display_msg = this.display_msg.bind(this)
    }

    componentDidMount() {
        this.get_msg()
        this.display_msg()
        setInterval(this.get_msg, 500);
        setInterval(this.display_msg, 1000);
    }

    async get_msg() {
        let max_buffer_size = 1000
        let self = this;
        axios.get(`http://127.0.0.1:5000/read_mq`)
            .then((res) => {
                //console.log(res.data.msg)
                if (res.data.status !== 'fail' && res.data.msg.length > 0) {
                    let tmp = this.state.MQ_buffer
                    tmp.push(...res.data.msg)
                    self.setState({MQ_buffer:tmp.slice(0,max_buffer_size)})
                    //console.log('receive new msg')
                }
            }).catch(function (error) {
                console.log(error.message);
            });
    }

    async display_msg(){
        let max_msg_display = 6
        if(this.state.MQ_buffer.length>0){
            let MQ_new = this.state.MQ
            let MQ_buffer_new = this.state.MQ_buffer
            let msg_new = MQ_buffer_new.splice(0,max_msg_display)
            for(var i=0;i<(MQ_new.length + msg_new.length - max_msg_display);i++){
                MQ_new.shift()
            }
            MQ_new.push(...msg_new)
            this.setState({MQ:MQ_new,MQ_buffer:MQ_buffer_new})
        }
    }

      
    switch_panel(panel){
        console.log('switching panel')
        this.setState({curretWorkSpace:panel})
    }

    set_data_panel_param(param){
        this.setState({data_panel_param:param})
    }

    renderPanel(){
        console.log('render panel testing')
        if(this.state.curretWorkSpace==='dataPanel'){
            return <DataPanel data_panel_param={this.state.data_panel_param} set_data_panel_param ={this.set_data_panel_param}/>
        }
        else if (this.state.curretWorkSpace==='controlPanel'){
            return <ControlPanel msg={this.state.MQ}/>
        }
        else if (this.state.curretWorkSpace==='userPanel'){
            return <UserPanel switch_panel = {this.switch_panel} set_data_panel_param ={this.set_data_panel_param}/>
        }
    }
    
    
    render() {
        return(
            <div className="grid">
                <div className="menu">
                    <TopMenu/>
                </div>
                <div className="side-menu">
                    <SideMenu  switch_panel = {this.switch_panel}/>
                </div>
                
                <this.renderPanel />
                
            </div>
        )
    }
}


export default dashboard

