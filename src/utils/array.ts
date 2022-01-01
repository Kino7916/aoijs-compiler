function clearArray(this: Array<any>) {
    while (this.length) {
        this.shift();
    }
}

export {clearArray}