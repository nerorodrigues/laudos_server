
import React from "react";
import { Component } from "react";
//import Test from "./Modules/Core/Test"
//import Login from "./Modules/Core/Login";
// import Logoff from "./Modules/Core/Logoff";
// import Upload from "./Modules/Upload";
import Cookies from "js-cookie";

import { BrowserRouter as Router, Route, Redirect, Switch, Link } from 'react-router-dom'
import { Menu, Form } from "semantic-ui-react";

const checkAuth = () => {
    return Cookies.get('signedin') == 'true'
}

const PrivateRoute = ({ component: Component, componentCallback, ...rest }) => (
    <Route {...rest}
        render={props =>
            checkAuth() ? (
                <Component {...props} componentCallback={componentCallback} />
            ) : (
                    <Redirect
                        to={{
                            pathname: "/login",
                            state: { from: props.location }
                        }}
                    />
                )
        }
    />
);

class Main extends Component {

    constructor(props) {
        super(props);
        console.log(props);
        this.state = { isLoggedIn: checkAuth() };
        this.componentCallback = this.componentCallback.bind(this);
    }

    componentCallback(value) {
        this.setState({ isLoggedIn: value });
    }

    render() {
        return (
            <div>
                <Form onSubmit={this.submitHandle}>
                    <h1>{this.state.finalizado}</h1>
                    <Form.Input type='file' required onChange={this.handleFile} />
                    <Form.Input type='submit' />
                </Form>
            </div>)
    }
}

export default function Upload(){
    return (
        <Main></Main>
    )
};