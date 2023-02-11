import React from 'react'
import { Button, Form, Grid, Header, Image, Segment, Message } from 'semantic-ui-react'
import history from './history';
import axios from 'axios';


class LoginPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = { login_state: 'init', login_msg:'', }
        this.handleLogin = this.handleLogin.bind(this)
        this.login_msg = this.login_msg.bind(this)
    }

    login_msg() {
        if (this.state.login_state !== 'success' && this.state.login_state !== 'init') {
            return <Message attached='bottom' negative>
                <Message.Header>Fail</Message.Header>
                <p>Something wrong with the backend</p>
                <p>{this.state.login_msg}</p>
            </Message>
        }
        else{return null}
    }

    async handleLogin() {
        let self=this
        await axios.get(`http://127.0.0.1:5000/`)
            .then(res => {
                console.log(res.data);
                if(res.data.status!=='ready'){
                    this.props.pageState.isLogin = false
                    self.setState({login_msg:'Cannot connect to backend',login_state:'fail'},()=>{console.log('Cannot connect to backend');})
                } 
            }).catch(function (error) {
                self.setState({login_msg:error.message,login_state:'fail'},()=>{console.log(error.message);})
            })

        axios.get(`http://127.0.0.1:5000/dashboard`)
            .then(res => {
                console.log(res.data);
                this.setState({login_state:res.data.status,login_msg:res.data.msg})
                if(res.data.status!=='fail'){
                    this.props.pageState.isLogin = true
                    history.push('/dashboard');
                } 
            }).catch(function (error) {
                self.setState({login_msg:error.message,login_state:'fail'},()=>{console.log(error.message);})
            })
    }

    render() {
        return (
            <Grid textAlign='center' style={{ height: '100vh' }} verticalAlign='middle'>
                <Grid.Column style={{ maxWidth: 450 }}>
                    <Header as='h2' color='teal' textAlign='center'>
                        <Image src='/logo1.png' /> Log-in to your account
                    </Header>
                    <Form size='large' >
                        <Segment stacked>
                            <Form.Input
                                fluid icon='user'
                                iconPosition='left'
                                placeholder='Username'
                                defaultValue='Admin'
                            />
                            <Form.Input
                                fluid
                                icon='lock'
                                iconPosition='left'
                                placeholder='Password'
                                type='password'
                                defaultValue='Admin'
                            />

                            <Button color='teal' fluid size='large' onClick={this.handleLogin}>
                                Login
                            </Button>
                        </Segment>
                    </Form>
                    {this.login_msg()}


                </Grid.Column>
            </Grid>
        )
    }
}


export default LoginPage