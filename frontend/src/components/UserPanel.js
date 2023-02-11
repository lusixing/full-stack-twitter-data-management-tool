import React, { Component } from 'react'
import {
    Input,
    Segment,
    Grid,
    Image,
    Dimmer, Loader, Pagination, Form, Card, Button, Modal, Header, Label, Icon, Popup, Checkbox
} from 'semantic-ui-react'

import axios from 'axios';
import { color } from '@mui/system';

class UserPanel extends Component {
    constructor(props) {
        super(props);
        this.state = {
            profiles: [],
            active_profiles: [],
            is_loading: true,
            user_edit_open: false,
            active_idx: 0,
            active_profile_old: [],
            active_tags: [],
            inactive_tags: []
        };
        this.profile_mapper = this.profile_mapper.bind(this)
        this.user_edit_panel = this.user_edit_panel.bind(this)
        this.handle_add_tag = this.handle_add_tag.bind(this)
        this.handle_del_tag = this.handle_del_tag.bind(this)
        this.handle_edit = this.handle_edit.bind(this)
        this.handle_cancel_edit = this.handle_cancel_edit.bind(this)
        this.label_selection = this.label_selection.bind(this)
        this.move_tag = this.move_tag.bind(this)
        this.apply_tags = this.apply_tags.bind(this)
        this.handle_search = this.handle_search.bind(this)
    }

    componentWillMount() {
        console.log('userpanel mounted')
        axios.get(`http://127.0.0.1:5000/get_all_profiles`)
            .then(res => {
                this.setState({ profiles: res.data.profile_data, is_loading: false })
                console.log('finished loading')

                let tag_set = new Set()
                for (let i = 0; i < res.data.profile_data.length; i++) {
                    for (let j = 0; j < res.data.profile_data[i].tags.length; j++) {
                        tag_set.add(res.data.profile_data[i].tags[j])
                    }
                }
                console.log(tag_set)
                this.setState({ active_tags: tag_set, inactive_tags: new Set(), active_profiles: this.state.profiles })
            })
    }

    gotoDataPanel(username) {
        //name.preventDefault();
        console.log(username)
        const req_form = {
            name: username,
        };

        axios.post(`http://127.0.0.1:5000/query_user`, req_form)
            .then(res => {
                console.log(res.data);
                if (res.data['status'] === 'success') {
                    let N_pages = Math.ceil(res.data.tweet_data.length / 10)
                    this.props.set_data_panel_param({ profile: res.data.profile, tweet_data: res.data.tweet_data,active_tweets:res.data.tweet_data, current_page: 1, N_pages: N_pages })
                    this.props.switch_panel('dataPanel')
                }
            })
    }

    handle_add_tag(event) {
        event.preventDefault();
        const { target } = event;
        let new_profiles = this.state.profiles
        const index = new_profiles[this.state.active_idx].tags.indexOf(target.tag_name.value);
        if (index === -1) {
            new_profiles[this.state.active_idx].tags.push(target.tag_name.value)
            this.setState({ profiles: new_profiles })
        }

    }

    handle_del_tag(e) {
        let new_profiles = this.state.profiles

        const index = new_profiles[this.state.active_idx].tags.indexOf(e.item);
        if (index > -1) { // only splice array when item is found
            new_profiles[this.state.active_idx].tags.splice(index, 1);
            this.setState({ profiles: new_profiles })
        }
    }

    handle_cancel_edit() {
        console.log(this.state.active_profile_old)
        let new_profiles = this.state.profiles
        new_profiles[this.state.active_idx] = this.state.active_profile_old
        this.setState({ profiles: new_profiles, user_edit_open: false })

    }

    handle_edit() {
        axios.post(`http://127.0.0.1:5000/update_user_profile`, this.state.profiles[this.state.active_idx])
            .then(res => {
                console.log(res.data);
                if (res.data['status'] === 'success') {
                    console.log("profile update success")
                }
                this.setState({ user_edit_open: false })
            })

    }

    user_edit_panel(item) {
        let idx = this.state.profiles.indexOf(item)
        let inner_item = this.state.profiles[this.state.active_idx]
        let profile_img_url = "http://127.0.0.1:5000//getfile//" + inner_item.name + "//" + inner_item.id + ".jpg"
        return (
            <Modal
                onClose={() => { this.setState({ user_edit_open: false }) }}
                onOpen={() => { this.setState({ user_edit_open: true }) }}
                open={this.state.user_edit_open}
                trigger={<Button basic color='blue' onClick={() => { this.setState({ active_idx: idx, active_profile_old: JSON.parse(JSON.stringify(this.state.profiles[idx])) }) }}>Edit</Button>}
            >
                <Modal.Header>Profile</Modal.Header>
                <Modal.Content image>
                    <Image size='medium' src={profile_img_url} wrapped />
                    <Modal.Description>
                        <Header>{inner_item.name} (@{inner_item.username})</Header>
                        <p>  {inner_item.description} </p>

                        <Label.Group tag>
                            {inner_item.tags.map((item) => { return <Label > {item} <Icon name='delete' onClick={() => { this.handle_del_tag({ item }) }} /></Label> })}

                        </Label.Group>

                        <Popup trigger={<Button icon='add'></Button>} flowing hoverable>
                            <Header as='h4'>Add a tag</Header>
                            <Form onSubmit={this.handle_add_tag}>
                                <Form.Field>
                                    <label >Tag Name</label>
                                    <input name='tag_name' />
                                </Form.Field>
                                <Button type='submit'>Add</Button>
                            </Form>
                        </Popup>
                    </Modal.Description>

                </Modal.Content>
                <Modal.Actions>
                    <Button color='grey' onClick={() => { this.handle_cancel_edit() }}>
                        Cancel
                    </Button>
                    <Button
                        content="Update"
                        labelPosition='right'
                        icon='checkmark'
                        onClick={() => { this.handle_edit() }}
                        positive
                    />
                </Modal.Actions>
            </Modal>
        )
    }

    profile_mapper(item) {
        let url = "http://127.0.0.1:5000//getfile//" + item.name + "//" + item.id + ".jpg"
        return (
            <Card>
                <Card.Content>
                    <Image
                        floated='right'
                        size='mini'
                        src={url}
                    />
                    <Card.Header>{item.name}</Card.Header>
                    <Card.Meta>@{item.username}</Card.Meta>
                    <Card.Description>
                        {item.description}
                        {item.tags.map((tag) => { return <Label > {tag} </Label> })}
                    </Card.Description>
                </Card.Content>
                <Card.Content extra>
                    <div className='ui two buttons'>
                        <Button basic color='green' onClick={() => { this.gotoDataPanel(item.username) }}>
                            Show tweets</Button>
                        {this.user_edit_panel(item)}

                    </div>
                </Card.Content>

            </Card>
        )

    }

    move_tag(tag, action) {
        let inactive_tags_new = this.state.inactive_tags
        let active_tags_new = this.state.active_tags

        if (action === 0) {
            active_tags_new.delete(tag)
            inactive_tags_new.add(tag)
        }
        else {
            inactive_tags_new.delete(tag)
            active_tags_new.add(tag)
        }

        this.setState({ active_tags: active_tags_new, inactive_tags: inactive_tags_new })
        this.apply_tags({}, { checked: true })
    }


    label_selection() {
        return (
            <Grid columns={2} divided>
                <Grid.Column>
                    <p>Avtive tags</p>
                    {Array.from(this.state.active_tags).map((tag) => { return <Label as='a' tag onClick={() => { this.move_tag(tag, 0) }}> {tag} </Label> })}
                </Grid.Column>

                <Grid.Column>
                    <p>Inavtive tags</p>
                    {Array.from(this.state.inactive_tags).map((tag) => { return <Label as='a' tag onClick={() => { this.move_tag(tag, 1) }}> {tag} </Label> })}
                </Grid.Column>
            </Grid>
        )
    }

    apply_tags(e, data) {
        console.log(data.checked)
        let active_profiles = []
        if (data.checked) {
            for (let i = 0; i < this.state.profiles.length; i++) {
                for (let j = 0; j < this.state.profiles[i].tags.length; j++) {
                    if (this.state.active_tags.has(this.state.profiles[i].tags[j])) {
                        active_profiles.push(this.state.profiles[i])
                        break
                    }
                }
            }
        }
        else {
            active_profiles = this.state.profiles
        }
        this.setState({ active_profiles: active_profiles })

    }

    handle_search(event){
        event.preventDefault();
        const { target } = event;
        console.log(target.search_text.value)
        let to_search = target.search_text.value
        let active_profiles = this.state.profiles
        let active_profiles_new = []
        for(let i=0;i<active_profiles.length;i++){
            if(active_profiles[i].name.includes(to_search)||active_profiles[i].description.includes(to_search)){
                active_profiles_new.push(active_profiles[i])
            }
        }
        this.setState({active_profiles:active_profiles_new})
    }

    render() {
        const inlineStyle = {
            style1: {
                top: '80px',
                left: '100px',
                width: '1200px'
            },
        };

        let content
        if (this.state.is_loading) {
            content = <Loader active inline='centered' />
        } else {
            content = <div>
                <Segment style={inlineStyle.style1}>
                    {this.label_selection()}
                    <br />
                    <Checkbox label='Show active tags only' onChange={(e, data) => this.apply_tags(e, data)} />


                </Segment>
                <Segment style={inlineStyle.style1}>
                    <Form onSubmit={this.handle_search}>
                        <Form.Field >
                            <Input style={{width:'150px'}} action='search' name='search_text' placeholder='anything...' />
                        </Form.Field >
                    </Form>
                    <br/>
                    <Card.Group attached='bottom'>
                        {this.state.active_profiles.map(this.profile_mapper)}
                    </Card.Group>
                </Segment></div>

        }

        return (
            <div>
                {content}
            </div>

        );
    }
}

export default UserPanel

