import React, { Component } from 'react'
import {
  Dropdown,
  Menu,
} from 'semantic-ui-react'
import history from '../history';

class TopMenu extends Component {
  state = {};

  render() {
    return (
      <Menu fixed="top" style={{
        height: '70px',
      }} >
        <Menu.Item onClick={() => { }}>
          Work Space
        </Menu.Item>

        <Menu.Menu position="right">


          <Menu.Item position="right">
            <Dropdown
              text='Admin'
              icon='user'
              floating
              labeled
              button
              className='icon'
            >
              <Dropdown.Menu>
                <Dropdown.Header icon='user' content='Login as Admin' />
                <Dropdown.Divider />
                <Dropdown.Item  text='Lougout' onClick={() => { history.goBack() }} />
              </Dropdown.Menu>
            </Dropdown>
          </Menu.Item>


        </Menu.Menu>
      </Menu>
    );
  }
}


export default TopMenu