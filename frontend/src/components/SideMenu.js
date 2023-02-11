import React, { Component } from 'react'
import { Menu } from 'semantic-ui-react'

class SideMenu extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            activeItem: 'dashboard',
        };
        this.getMenu = this.getMenu.bind(this)
    }


    getMenu() {
        const inlineStyle = {
            input: {
                top: '70px',
                width: '180px'
            }
        };
        return (
            <Menu borderless fixed='left' vertical style={inlineStyle.input}>

                <Menu.Item name='Data Panel'
                    active={this.state.activeItem === 'dataPanel'}
                    onClick={() => { this.props.switch_panel('dataPanel'); this.setState({ activeItem: 'dataPanel' }) }}
                >
                </Menu.Item>


                <Menu.Item
                    name='Control Panel'
                    active={this.state.activeItem === 'controlPanel'}
                    onClick={() => { this.props.switch_panel('controlPanel'); this.setState({ activeItem: 'controlPanel' }) }}
                >
                </Menu.Item>
                
                <Menu.Item
                    name='User Panel'
                    active={this.state.activeItem === 'userPanel'}
                    onClick={() => { this.props.switch_panel('userPanel'); this.setState({ activeItem: 'userPanel' }) }}
                >
                </Menu.Item>

            </Menu>
        )
    }

    render() {
        return (
            <div className='parent'>
                <div>
                    {this.getMenu()}
                </div>
            </div>
        )
    }
}

export default SideMenu
