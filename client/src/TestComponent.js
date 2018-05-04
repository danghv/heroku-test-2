import React, { Component } from 'react'

export default class TestComponent extends Component {
    state = {
        ...this.props
    }

    render() {
        return (
            <div>{ this.props.isDisplay && (<h1>test</h1>) }</div>
        )
    }
}