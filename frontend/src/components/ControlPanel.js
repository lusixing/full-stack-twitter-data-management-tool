import React, { Component } from 'react'
import {
  Input,
  Segment,
  Message,
  Divider, Form, Checkbox
} from 'semantic-ui-react'
import axios from 'axios';

const inlineStyle = {
  style1: {
    top: '80px',
    left: '100px',
    width: '1200px'
  },
  input: {
    width: '120px'
  }
};

class ControlPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      input1_state: "init",
      input1_response_msg: "",
      input2_state: "init",
      input2_response_msg: "",
      only_recent: false,
      update_all_users: false
    };
    this.handleClawTweetData = this.handleClawTweetData.bind(this)
    this.handleCreateNewProfile = this.handleCreateNewProfile.bind(this)
    this.input1 = this.input1.bind(this)
    this.msg1 = this.msg1.bind(this)
    this.input2 = this.input2.bind(this)
    this.msg2 = this.msg2.bind(this)
  }


  handleCreateNewProfile = (event) => {
    event.preventDefault();
    const { target } = event;
    //console.log(target.name.value)
    this.setState({ input1_state: "loading" })
    const req_form = {
      username: target.name.value,
    };
    this.setState({ input1_state: "loading" })
    let self = this;
    axios.post(`http://127.0.0.1:5000/create_user`, req_form)
      .then(res => {
        console.log(res.data);
        if(res.data.status==='success'){
          self.setState({ input1_state: "done", input1_response_msg: res.data.info },console.log('request complete'))
        }
        else{
          self.setState({ input1_state: "fail", input1_response_msg: res.data.info },console.log('request incomplete'))
        }
        
      }).catch(function (error) {
        console.log(error.message);
        self.setState({ input1_state: "fail", input1_response_msg: error.message })
      });
  }


  handleClawTweetData = (event) => {
    event.preventDefault();
    const { target } = event;
    this.setState({ input2_state: "loading" })
    const req_form = {
      username: target.name.value,
      only_recent: this.state.only_recent,
      update_all_users: this.state.update_all_users
    };
    let self = this;
    axios.post(`http://127.0.0.1:5000/claw_user_data`, req_form)
      .then(res => {
        //console.log(res);
        console.log(res.data);
        if (res.data.status !== 'fail') {
          self.setState({ input2_state: "done", input2_response_msg: res.data })
        }
        else {
          self.setState({ input2_state: "fail", input2_response_msg: res.data.error_info })
        }
      }).catch(function (error) {
        console.log(error.message);
        self.setState({ input2_state: "fail", input2_response_msg: error.message })
      });
  }


  input1() {
    if (this.state.input1_state === "loading") {
      return <Input loading style={inlineStyle.input} action='submit' name='name' placeholder='@username...' />
    }
    else {
      return <Input style={inlineStyle.input} action='submit' name='name' placeholder='@username...' />
    }
  }

  input2() {
    let loading
    let disabled
    if (this.state.input2_state === "loading") {
      loading = true
      disabled = true
    } else if (this.state.update_all_users) {
      loading = false
      disabled = true
    }

    return <Input loading={loading} disabled={disabled} style={inlineStyle.input} name='name' placeholder='@username...' />

  }

  msg1() {
    if (this.state.input1_state === "fail") {
      return (<Message negative>
        <Message.Header>Fail</Message.Header>
        <p>{this.state.input1_response_msg}</p>
      </Message>)
    }
    else if (this.state.input1_state === "done") {
      return (<Message positive>
        <Message.Header>Done</Message.Header>
        <p>{this.state.input1_response_msg.status}</p>
      </Message>)
    }

  }

  msg2() {
    if (this.state.input2_state === "fail") {
      return (<Message negative>
        <Message.Header>Fail</Message.Header>
        <p>{this.state.input2_response_msg}</p>
      </Message>)
    }
    else if (this.state.input2_state === "done") {
      return (<Message positive>
        <Message.Header>Done</Message.Header>
        <p>{this.state.input2_response_msg.N_tweets_updated} new tweets retrieved</p>
      </Message>)
    }

  }


  render() {
    let msg = this.props.msg
    return (
      <div>
        <Segment style={inlineStyle.style1}>
          <b>Create tweet user profile by name: </b>
          <Form onSubmit={this.handleCreateNewProfile}>
            <Form.Field >
              <this.input1 />
              <this.msg1 />
            </Form.Field>

          </Form>

          <Divider section='true' />

          <b>Retrieve tweet data by name: </b>
          <Form className='attached fluid segment' onSubmit={this.handleClawTweetData}>
            <Form.Field >
              <this.input2 />
              <this.msg2 />
            </Form.Field>
            <Form.Field>
              <Checkbox label='Get recent tweets only ' onChange={(e, data) => this.setState({ only_recent: data.checked })} />
              <br />
              <Checkbox label='Update all users' onChange={(e, data) => this.setState({ update_all_users: data.checked })} />
            </Form.Field>
            <Form.Button content='Submit' type="submit" />
          </Form>
          <Message attached='bottom' color='black'>
            {msg.map((item)=>{return <p>{item}</p>})}
          </Message>
        </Segment>
      </div>


    );
  }
}

export default ControlPanel
