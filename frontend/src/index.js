import React from "react";

import ReactDOM from "react-dom";
import { Container } from "semantic-ui-react";
import { Router, Route } from 'react-router-dom';
import history from './history';


import PageLogin from "./pageLogin"
import Dashboard from "./dashboard";


const App = ({ children }) => (
    <Container style={{ margin: 20 }}>
        {children}
    </Container>
);

const pageState={
    isLogin:false,
    token:''
}


const styleLink = document.createElement("link");
styleLink.rel = "stylesheet";
styleLink.href = "https://cdn.jsdelivr.net/npm/semantic-ui/dist/semantic.min.css";
document.head.appendChild(styleLink);

const rootElement = document.getElementById("root");
ReactDOM.render(

    <Router history={history}>
        <App>
            <Route exact path="/" render={()=> <PageLogin pageState={pageState} />} />
            <Route path="/dashboard" render={()=> <Dashboard pageState={pageState} />} />
        </App>
    </Router>,

    rootElement
);
