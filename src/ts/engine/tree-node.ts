class TreeNode {
    private readonly children: TreeNode[] = [];

    private subDepthsCache: TreeNode[][] = [];
    private parent: TreeNode = null;

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
        }

        if (typeof this.subDepthsCache[depth] !== "undefined") {
            return this.subDepthsCache[depth];
        }

        // no cache => build it
        let result: TreeNode[];
        if (depth === 0) {
            result = [this];
        } else {
            result = [];
            for (const child of this.children) {
                const subchildren = child.getChildrenOfDepth(depth - 1);
                if (subchildren.length > 0) {
                    result = result.concat(subchildren);
                }
            }
        }

        this.subDepthsCache[depth] = result;
        return result;
    }

    public removeChild(child: TreeNode): void {
        for (let iC = this.children.length - 1; iC >= 0; iC--) {
            if (this.children[iC] === child) {
                this.children[iC].parent = null;
                this.children.splice(iC, 1);
                this.onSubtreeChange(1);
                return;
            }
        }

        throw new Error("Cannot remove an unknown child.");
    }

    protected addChildren(...newChildren: TreeNode[]): void {
        if (newChildren.length > 0) {
            for (const newChild of newChildren) {
                if (newChild.parent) {
                    throw new Error("Cannot attach a tree node that already has a parent.");
                }
                newChild.parent = this;
            }
            Array.prototype.push.apply(this.children, newChildren);
            this.onSubtreeChange(1);
        }
    }

    protected removeChildren(): void {
        for (const child of this.children) {
            child.parent = null;
        }

        this.children.length = 0;
        this.onSubtreeChange(1);
    }

    public onSubtreeChange(invalidatedLevel: number): void {
        // remove all caches for levels lower or equal than the one that changed
        if (this.subDepthsCache.length >= invalidatedLevel + 1) {
            this.subDepthsCache.length = invalidatedLevel;
        }

        if (this.parent) {
            this.parent.onSubtreeChange(invalidatedLevel + 1);
        }
    }
}

export {
    TreeNode,
};
