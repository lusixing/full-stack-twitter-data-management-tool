import React, { Component } from 'react'
import {
  Input,
  Segment,
  Grid,
  Image,
  Divider, Icon, Pagination, Form, Modal, Button, Item, Label
} from 'semantic-ui-react'

import ReactPlayer from 'react-player'
import axios from 'axios';


function PicModal({ src }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Modal
      onClose={() => setOpen(false)}
      onOpen={() => setOpen(true)}
      open={open}
      trigger={<Image size="small" src={src} />}
    >
      <Modal.Content image>
        <Image
          size="large"
          src={src}
          wrapped
        />
      </Modal.Content>
      <Modal.Actions>
        <Button color="black" onClick={() => setOpen(false)}>
          Close
        </Button>
      </Modal.Actions>
    </Modal>
  );
}


class DataPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: { tweet_data: [] },
      current_page: 1,
      N_pages: 0,
    };
    this.display_tweet_test1 = this.display_tweet_test1.bind(this)
    this.handle_search = this.handle_search.bind(this)
  }


  inlineStyle = {
    style1: {
      width: '100px'
    }
  };

  handleNameQuery = (event) => {
    event.preventDefault();
    const { target } = event;
    console.log(target.name.value)

    const req_form = {
      name: target.name.value,
    };

    axios.post(`http://127.0.0.1:5000/query_user`, req_form)
      .then(res => {
        console.log(res.data);
        if (res.data['status'] === 'success') {
          let N_pages = Math.ceil(res.data.tweet_data.length / 10)
          this.props.set_data_panel_param({ profile: res.data.profile, tweet_data: res.data.tweet_data, active_tweets:res.data.tweet_data, current_page: 1, N_pages: N_pages })
        }
      })
  }


  media_mapper({ param }) {
    const type = param.type
    const urls = param.urls
    if (type === "video") {
      return <Grid.Column><ReactPlayer url={urls[0]} controls={true} /></Grid.Column>
    }
    else {
      const img_group = urls.map((url) => { return <Grid.Column>< PicModal src={url} /></Grid.Column> })
      return img_group
    }

  }

  display_tweet_test1(item) {
    const text = item['text']
    const date = item['created_at']
    let urls = []
    let name = this.props.data_panel_param.profile.name
    if (item.hasOwnProperty('attachments') && item.attachments.hasOwnProperty('media_keys')) {
      for (var i = 0; i < item.attachments.media_keys.length; i++) {
        let url = "http://127.0.0.1:5000//getfile//" + name + "//" + item.attachments.media_keys[i]
        item.media_type === "photo" ? url += ".jpg" : url += ".mp4"
        urls.push(url)
      }
    }//console.log(urls)

    return (
      <Segment>
        <h5 > {String(date)}</h5>
        <h5 >{text}</h5>
        <Grid divided='vertically'>
          <Grid.Row columns={4}>
            {<this.media_mapper param={{ type: item.media_type, urls: urls }} />}
          </Grid.Row>
        </Grid>
      </Segment>

    )
  }

  handle_search(event){
    event.preventDefault();
    const { target } = event;
    console.log(target.search_text.value)
    let to_search = target.search_text.value
    
    let tweet_data = this.props.data_panel_param.tweet_data
    let current_page = this.props.data_panel_param.current_page
    let profile = this.props.data_panel_param.profile
    let active_tweets_new = []
    for(let i=0;i<tweet_data.length;i++){
      if(tweet_data[i].text.includes(to_search)){
        active_tweets_new.push(tweet_data[i])
      }
    }
    let N_pages = Math.ceil(active_tweets_new.length / 10)
    this.props.set_data_panel_param({ profile: profile, tweet_data: tweet_data,active_tweets:active_tweets_new, current_page: current_page, N_pages: N_pages })
  }

  render() {
    console.log('datapanel rendering')
    let tweet_data = this.props.data_panel_param.tweet_data
    let active_tweets = this.props.data_panel_param.active_tweets
    let current_page = this.props.data_panel_param.current_page
    let N_pages = this.props.data_panel_param.N_pages
    let profile = this.props.data_panel_param.profile
    console.log(active_tweets)

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

    let profile_img_url = "http://127.0.0.1:5000//getfile//" + profile.name + "//" + profile.id + ".jpg"
    let profile_content = null
    if (JSON.stringify(profile) !== '{}') {
      profile_content = <Item.Group divided>
        <Item>
          <Item.Image src={profile_img_url} size='small' />

          <Item.Content>
            <Item.Header as='a'>{profile.name}</Item.Header>
            <Item.Meta>
              <span className='cinema'>{profile.username}</span>
            </Item.Meta>
            <Item.Description>{profile.description}</Item.Description>
            <Item.Extra>
              <Label>IMAX</Label>
              <Label icon='globe' content='Additional Languages' />
            </Item.Extra>
          </Item.Content>
        </Item>

      </Item.Group>
    }

    return (
      <Segment style={inlineStyle.style1}>
        <b>View data from user: </b>
        <Form onSubmit={this.handleNameQuery}>
          <Form.Field >
            <Input style={inlineStyle.input} action='submit' name='name' placeholder='Search...' />
          </Form.Field>
        </Form>

        <Divider section='true' />
        {profile_content}
        <Divider />

        <Form onSubmit={this.handle_search}>
          <Form.Field >
            <Input style={{ width: '150px' }} action='search' name='search_text' placeholder='anything...' />
          </Form.Field >
        </Form>

        {active_tweets.slice((current_page - 1) * 10, current_page * 10).map(this.display_tweet_test1)}
        <Divider section='true' />

        <Grid columns={2} verticalAlign='middle'>
          <Grid.Column>
            <Segment secondary>
              <div>activePage: {current_page}</div>
              <Input
                min={1}
                max={N_pages}
                onChange={(e, { value }) => this.props.set_data_panel_param({ profile: profile, tweet_data: tweet_data,active_tweets:active_tweets, current_page: value, N_pages: N_pages })}
                type='range'
                value={current_page}
              />
            </Segment>
          </Grid.Column>
          <Grid.Column>
            <Pagination
              defaultActivePage={1}
              activePage={current_page}
              ellipsisItem={{ content: <Icon name='ellipsis horizontal' />, icon: true }}
              firstItem={{ content: <Icon name='angle double left' />, icon: true }}
              lastItem={{ content: <Icon name='angle double right' />, icon: true }}
              prevItem={{ content: <Icon name='angle left' />, icon: true }}
              nextItem={{ content: <Icon name='angle right' />, icon: true }}
              totalPages={N_pages}
             
              onPageChange={(event, data) => { this.props.set_data_panel_param({ profile: profile, tweet_data: tweet_data, active_tweets:active_tweets, current_page: data.activePage, N_pages: N_pages }); window.scrollTo(0, 0) }}
            />
          </Grid.Column>
        </Grid>
      </Segment>
    );
  }
}

export default DataPanel
