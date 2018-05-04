import React, {Component} from 'react'
import {Page, Card, Button} from '@shopify/polaris'
import TestComponent from './TestComponent'
import axios from 'axios'

// import {EmbeddedApp} from '@shopify/polaris/embedded'

class App extends Component {
    state = {
        display: true,
        text: ''
    }
    render() {
        return (
            <Page title="Example app">
                <Card sectioned>
                    <Button onClick={() => {
                        this.setState({ display: !this.state.display })
                    }}>Example button</Button>
                </Card>
                <Card sectioned>
                    <Button onClick={() => {
                        console.log('click')
                        axios.get('https://jsonplaceholder.typicode.com/posts/1')
                            .then(result => {
                                console.log(result.data)
                                this.setState({ text: JSON.stringify(result.data)})
                            })
                    }}>Example button 2</Button>
                </Card>
                <TestComponent isDisplay={this.state.display}/>
                <h1>{this.state.text}</h1>
            </Page>

        )
    }
}

export default App;
