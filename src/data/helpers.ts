import { ScalingFunction } from "features/conversion";
import { Visibility } from "features/feature";
import { createTreeNode, GenericTree, GenericTreeNode } from "features/trees/tree";
import Decimal, { DecimalSource } from "util/bignum";
import { Ref, unref } from "vue";

export function createExponentialScaling(
    factor: DecimalSource | Ref<DecimalSource>,
    base: DecimalSource | Ref<DecimalSource>,
    exponent: DecimalSource | Ref<DecimalSource>
): ScalingFunction {
    return {
        currentGain(conversion) {
            const gain = Decimal.div(conversion.baseResource.value, unref(factor))
                .log(unref(base))
                .root(unref(exponent));

            if (gain.isNan()) {
                return new Decimal(0);
            }
            return gain;
        },
        currentAt(conversion) {
            let current: DecimalSource = unref(conversion.currentGain);
            if (conversion.gainModifier) {
                current = conversion.gainModifier.revert(current);
            }
            current = Decimal.max(0, current);
            return Decimal.pow(unref(base), Decimal.pow(current, unref(exponent))).times(
                unref(factor)
            );
        },
        nextAt(conversion) {
            let next: DecimalSource = Decimal.add(unref(conversion.currentGain), 1);
            if (conversion.gainModifier) {
                next = conversion.gainModifier.revert(next);
            }
            next = Decimal.max(0, next);
            return Decimal.pow(unref(base), Decimal.pow(next, unref(exponent)))
                .times(unref(factor))
                .max(unref(base));
        }
    };
}

export const oneWayBranchedResetPropagation = function (
    tree: GenericTree,
    resettingNode: GenericTreeNode
): void {
    const visitedNodes = [resettingNode];
    let currentNodes = [resettingNode];
    if (tree.branches != null) {
        const branches = unref(tree.branches);
        while (currentNodes.length > 0) {
            const nextNodes: GenericTreeNode[] = [];
            currentNodes.forEach(node => {
                branches
                    .filter(branch => branch.startNode === node)
                    .map(branch => branch.endNode)
                    .filter(node => !visitedNodes.includes(node))
                    .forEach(node => {
                        // Check here instead of in the filter because this check's results may
                        // change as we go through each node
                        if (!nextNodes.includes(node)) {
                            nextNodes.push(node);
                            node.reset?.reset();
                        }
                    });
            });
            currentNodes = nextNodes;
            visitedNodes.push(...currentNodes);
        }
    }
};

export function versionGT(v1: string | undefined, v2: string | undefined): boolean {
    if (v2 === undefined) return false;
    if (v1 === undefined) return true;

    const vl1 = v1.split(".");
    const vl2 = v2.split(".");
    return (
        parseInt(vl1[0] ?? "0") > parseInt(vl2[0] ?? "0") ||
        parseInt(vl1[1] ?? "0") > parseInt(vl2[1] ?? "0") ||
        parseInt(vl1[2] ?? "0") > parseInt(vl2[2] ?? "0")
    );
}

export function overrideIsRecord<T extends Record<string | number | symbol, any>>(
    obj: unknown
): obj is T {
    return true;
}

export function fixPoint4Obj(obj: unknown) {
    if (overrideIsRecord(obj)) {
        return fixPoint4Record(obj);
    }

    return {};
}

function fixPoint4Record<T, S extends { [key: string]: T }>(obj: S) {
    const newObj: { [key: string]: any } = {};

    Object.keys(obj).forEach(key => {
        newObj[key] = {
            bought: obj[key]
        };
    });

    return newObj;
}

export const emptyTreeNode = createTreeNode(() => ({
    visibility: Visibility.Hidden
}));
