import React, { Component } from 'react'
import { Menu, Container, Button} from 'semantic-ui-react';
import {withFirebase} from 'react-redux-firebase'
import {NavLink, Link, withRouter} from 'react-router-dom'
import {connect} from 'react-redux'
import SignedInMenu from '../signenInMenu'
import SignOutMenu from '../SignOutMenu'
import {openModal}  from '../../Modal/modalActCreator/index'

const  actions = {
  openModal,
  
}

const mapState = (state) => ({
  auth:state.firebase.auth,
  profile:state.firebase.profile
})

 class Navbar extends Component {
   

   handleSignout = () => {
     this.props.firebase.logout()
    
     this.props.history.push('/')

   }

   handleSigin = () => {
    this.props.openModal('LoginModal')


   }

   handlerRegister = () => {
       this.props.openModal('RegisterModal')
   }

  render() { 
     const {auth, profile} = this.props;
     console.log(auth.authenticated)
     const authenticated=auth.isLoaded && !auth.isEmpty;
    return (
              <Menu inverted fixed="top">
                <Container>
                  <Menu.Item header as={Link} to="/">
                    <img src="/assets/logo.png" alt="logo" />
                    Hoffyevents
                  </Menu.Item>
                  <Menu.Item name="Events" as={NavLink} to="/events" />
                  <Menu.Item name="Test" as={NavLink} to="/test" />
                  {authenticated &&
                  <Menu.Item name="People" as={NavLink} to="/people" />
                  }
                  {authenticated &&
                  <Menu.Item>
                    <Button
                    floated="right"
                     as={Link}
                     to="/createEvent"
                    positive inverted content="Create Event" />
                  </Menu.Item>
                }
                  {authenticated ?
                  <SignedInMenu auth={auth} profile={profile} handleSignout={this.handleSignout} /> : <SignOutMenu handleSigin={this.handleSigin}  handlerRegister={this. handlerRegister}/> }




                </Container>
              </Menu>
    )
  }

}

export default withRouter(withFirebase(connect(mapState, actions)(Navbar)))