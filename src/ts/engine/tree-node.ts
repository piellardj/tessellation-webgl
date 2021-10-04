class TreeNode {
    private readonly children: TreeNode[] = [];

    public treeDepth(): number {
        if (this.children.length > 0) {
            return this.children[0].treeDepth() + 1;
        }
        return 1;
    }

    public getDirectChildren(): TreeNode[] {
        return this.getChildrenOfDepth(1);
    }

    public getChildrenOfDepth(depth: number): TreeNode[] {
        if (depth < 0) {
            return [];
        } else if (depth === 0) {
            return [this];
        }

        const result: TreeNode[] = [];
        for (const child of this.children) {
            const subchildren = child.getChildrenOfDepth(depth - 1);
            if (subchildren.length > 0) {
                Array.prototype.push.apply(result, subchildren);
            }
        }

        return result;
    }

    protected addChildren(...newChildren: TreeNode[]): void {
        Array.prototype.push.apply(this.children, newChildren);
    }

    protected removeChildren(): void {
        this.children.length = 0;
    }

    public removeChild(child: TreeNode): void {
        for (let iC = this.children.length - 1; iC >= 0; iC--) {
            if (this.children[iC] === child) {
                this.children.splice(iC, 1);
                return;
            }
        }

        throw new Error("Cannot remove an unknown child.");
    }
}

export {
    TreeNode,
};
