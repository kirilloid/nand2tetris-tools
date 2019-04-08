import * as React from 'react';

export default abstract class BufferedTable<T> extends React.Component {
    props: {
        lines: T[]
    };
    state: {
        scrollPosition: number;
    }
    private ELT_HEIGHT = 30;
    protected root: HTMLElement | null;
    protected container: HTMLElement | null;
    componentDidMount() {
        if (this.root !== null) {
            this.root.onscroll = event => {
                if (this.root !== null) {
                    this.setState({ scrollPosition: this.root.scrollTop });
                }
            };
        }
    }
    componentWillUnmount() {
        if (this.root !== null) {
            delete this.root.onscroll;
        }
    }
    abstract renderRow(element: T, index: number): JSX.Element;
    render() {
        return <div ref={div => this.root = div} style={{ofverflow: "auto"}}>
            <div ref={div => this.container = div}>
                {this.props.lines.map((e, i) => this.renderRow(e, i))}
            </div>
        </div>
    }
}