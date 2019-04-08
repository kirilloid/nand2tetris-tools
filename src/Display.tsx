import * as React from 'react';
import { VGA, Change } from './model/machine/vga';

export default class Display extends React.Component {
    props: { display: VGA };
    state: { successfullInit: boolean };
    private ctx: CanvasRenderingContext2D | null;
    shouldComponentUpdate(): boolean {
        return false;
    }
    protected redraw({ sx, sy, values }: Change): void {
        if (this.ctx === null) return;
        let i = 0;
        const imageData: ImageData = this.ctx.getImageData(sx, sy, values[0].length, values.length);
        values.forEach(row =>
            row.forEach(cell =>
                cell.forEach(v => imageData.data[i++] = v)));
        this.ctx.putImageData(imageData, sx, sy);
    }
    private renderError() {
        const ctx = this.ctx;
        if (ctx === null) return;
        ctx.fillStyle = "#06a";
        ctx.fillRect(0, 0, 512, 256);
        ctx.strokeStyle = "#fff";
        ctx.font = "96px Arial";
        ctx.strokeText(":(", 24, 24);
        ctx.font = "24px Arial";
        ctx.strokeText("Your computer ran into a problem and needs to restart. We're just doing nothing about it so you should restart it by yourself.", 20, 120, 464);
        ctx.font = "12px Arial";
        ctx.strokeText("This fine print block is to distract you and I believe overall page  layout is not copyrighted.", 20, 220, 464);
    }
    private renderComplete() {
        const ctx = this.ctx;
        if (ctx === null) return;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, 512, 256);
        ctx.strokeStyle = "#f80";
        ctx.font = "24px Arial";
        ctx.strokeText("It's now safe to turn off", 64, 64);
        ctx.strokeText("your computer.", 128, 88);
    }
    private setCanvas(canvas: HTMLCanvasElement | null) {
        if (canvas === null) {
            this.setState({ failedInit: false });
            return;
        }
        this.ctx = canvas.getContext('2d');
        if (this.ctx === null) {
            this.setState({ failedInit: false });
        } else {
            this.setState({ failedInit: true });
        }
    }
    componentDidMount() {
        if (this.ctx === null) return;
        this.ctx.fillStyle = "#fff";
        this.ctx.fillRect(0, 0, 512, 256);
        this.props.display.updates.subscribe({
            next: this.redraw.bind(this),
            error: this.renderError.bind(this),
            complete: this.renderComplete.bind(this)
        });
    }
    render() {
        return (this.state.successfullInit
            ? <canvas ref={canvas => this.setCanvas(canvas)}
                    width={this.props.display.width}
                    height={this.props.display.height}>
            </canvas>
            : <div>Cannot initialize canvas</div>
        );
    }
}