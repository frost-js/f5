class FillSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .fill('red')
            .rect(150, 100, 300, 200);
    }
}

class FontSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .fill('#000')
            .noStroke()
            .font('Times New Roman')
            .fontSize('48')
            .textAlign('center')
            .text('Hello', 300, 200);
    }
}

class FontSizeSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .fill('#000')
            .noStroke()
            .fontSize('96')
            .textAlign('center')
            .text('Hello', 300, 200);
    }
}

class FontWeightSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .fill('#000')
            .noStroke()
            .fontSize('48')
            .fontWeight('bold')
            .textAlign('center')
            .text('Hello', 300, 200);
    }
}

class NoFillSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .noFill()
            .rect(150, 100, 300, 200);
    }
}

class NoStrokeSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .fill('red')
            .noStroke()
            .rect(150, 100, 300, 200);
    }
}

class NoShadowSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .fill('red')
            .noShadow()
            .rect(150, 100, 300, 200);
    }
}

class ShadowBlurSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .shadowBlur(10)
            .shadow('#000')
            .rect(150, 100, 300, 200);
    }
}

class shadowSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .shadowBlur(10)
            .shadow('blue')
            .rect(150, 100, 300, 200);
    }
}

class ShadowOffsetSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .shadowBlur(10)
            .shadow('#000')
            .shadowOffset(10, 10)
            .rect(150, 100, 300, 200);
    }
}

class StrokeSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .stroke('blue')
            .rect(150, 100, 300, 200);
    }
}

class StrokeWidthSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .strokeWidth(5)
            .rect(150, 100, 300, 200);
    }
}

class TextSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .fill('#000')
            .noStroke()
            .fontSize('48')
            .textAlign('center')
            .text('Hello', 300, 200);
    }
}

class TextAlignSketch extends F5.Canvas {
    setup() {
        this.noLoop();

        this.context
            .background('#aaa')
            .fill('#000')
            .noStroke()
            .fontSize('48')
            .textAlign('right')
            .text('Hello', 300, 200);
    }
}

const fill = document.getElementById('fill');
const font = document.getElementById('font');
const fontSize = document.getElementById('fontSize');
const fontWeight = document.getElementById('fontWeight');
const noFill = document.getElementById('noFill');
const noShadow = document.getElementById('noShadow');
const noStroke = document.getElementById('noStroke');
const shadowBlur = document.getElementById('shadowBlur');
const shadow = document.getElementById('shadow');
const shadowOffset = document.getElementById('shadowOffset');
const stroke = document.getElementById('stroke');
const strokeWidth = document.getElementById('strokeWidth');
const text = document.getElementById('text');
const textAlign = document.getElementById('textAlign');

FillSketch.attach(fill);
FontSketch.attach(font);
FontSizeSketch.attach(fontSize);
FontWeightSketch.attach(fontWeight);
NoFillSketch.attach(noFill);
NoShadowSketch.attach(noShadow);
NoStrokeSketch.attach(noStroke);
ShadowBlurSketch.attach(shadowBlur);
shadowSketch.attach(shadow);
ShadowOffsetSketch.attach(shadowOffset);
StrokeSketch.attach(stroke);
StrokeWidthSketch.attach(strokeWidth);
TextSketch.attach(text);
TextAlignSketch.attach(textAlign);
