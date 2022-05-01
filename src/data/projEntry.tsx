import Spacer from "components/layout/Spacer.vue";
import { jsx, Visibility } from "features/feature";
import { createResource, trackBest, trackOOMPS, trackTotal } from "features/resources/resource";
import {
    defaultResetPropagation,
    createTree,
    GenericTree,
    GenericTreeNode
} from "features/trees/tree";
import { globalBus } from "game/events";
import { createLayer, GenericLayer } from "game/layers";
import player, { PlayerData } from "game/player";
import Decimal, { DecimalSource, format, formatWhole, formatTime } from "util/bignum";
import { render } from "util/vue";
import { computed, toRaw, unref } from "vue";
import flame from "./layers/row1/Flame";
import life from "./layers/row1/Life";
import aqua from "./layers/row1/Aqua";
import advancements from "./layers/Advancements";
import lightning from "./layers/row2/Lightning";
import cryo from "./layers/row2/Cryo";
import air from "./layers/row2/Air";
import earth from "./layers/row2/Earth";
import { oneWayBranchedResetPropagation } from "./helpers";
import combinators from "./layers/row3/Combinators";

const customResetPropagation = function (tree: GenericTree, resettingNode: GenericTreeNode): void {
    if (advancements.milestones[12].earned.value)
        oneWayBranchedResetPropagation(tree, resettingNode);
    else defaultResetPropagation(tree, resettingNode);
};

/**
 * @hidden
 */
export const main = createLayer("main", () => {
    const particles = createResource<DecimalSource>(10, "particles", 2);
    const best = trackBest(particles);
    const total = trackTotal(particles);

    const baseGain = computed(() => {
        let gain = new Decimal(0);

        if (flame.upgradesR1[0].bought.value) gain = gain.plus(flame.upgradeEffects[0].value);
        if (flame.upgradesR2[2].bought.value) gain = gain.plus(flame.upgradeEffects[5].value);
        gain = gain.plus(life.buyableEffects[0].value);
        gain = gain.plus(Decimal.floor(aqua.bubbles.value));
        if (lightning.lightningSel.value == 0)
            gain = gain.plus(lightning.clickableEffects[0].value);
        gain = gain.plus(earth.baseGainAdded.value);
        gain = gain.plus(combinators.multiBuyableEffects[0].value);

        return gain;
    });

    const baseGainExp = computed(() => {
        let exp = Decimal.dOne;

        exp = exp.times(air.tornadoEff.value);

        return exp;
    });

    const particleGain = computed(() => {
        const base = baseGain.value;
        let gain = Decimal.pow(base, baseGainExp.value);

        if (flame.upgradesR1[1].bought.value) gain = gain.times(flame.upgradeEffects[1].value);
        gain = gain.times(life.buyableEffects[1].value);
        if (lightning.lightningSel.value == 1)
            gain = gain.times(lightning.clickableEffects[1].value);
        if (lightning.lightningSel.value == 3)
            gain = gain.times(lightning.clickableEffects[3].value);
        if (advancements.milestones[7].earned.value)
            gain = gain.times(
                Decimal.pow(aqua.torrentEff.value.plus(1), Decimal.floor(aqua.torrents.value))
            );
        if (
            Decimal.gte(combinators.multiBuyables[1].value, 1) &&
            advancements.milestones[15].earned.value
        )
            gain = gain.times(combinators.multiBuyableEffects[1].value);

        return gain;
    });

    globalBus.on("update", diff => {
        particles.value = Decimal.add(particles.value, Decimal.times(particleGain.value, diff));
    });
    const oomps = trackOOMPS(particles, particleGain);

    const tree = createTree(() => {
        return {
            nodes: [
                [flame.treeNode, life.treeNode, aqua.treeNode],
                [earth.treeNode, lightning.treeNode, air.treeNode, cryo.treeNode],
                [combinators.treeNode]
            ],
            leftSideNodes: [advancements.treeNode],
            branches: () => {
                const b = [];

                if (cryo.treeNode.visibility.value == Visibility.Visible) {
                    b.push({
                        startNode: cryo.treeNode,
                        endNode: aqua.treeNode
                    });
                }

                if (air.treeNode.visibility.value == Visibility.Visible) {
                    b.push({
                        startNode: air.treeNode,
                        endNode: life.treeNode
                    });
                }

                if (earth.treeNode.visibility.value == Visibility.Visible) {
                    b.push({
                        startNode: earth.treeNode,
                        endNode: flame.treeNode
                    });
                }

                if (combinators.treeNode.visibility.value == Visibility.Visible) {
                    b.push({
                        startNode: combinators.treeNode,
                        endNode: earth.treeNode
                    });
                    b.push({
                        startNode: combinators.treeNode,
                        endNode: lightning.treeNode
                    });
                    b.push({
                        startNode: combinators.treeNode,
                        endNode: air.treeNode
                    });
                    b.push({
                        startNode: combinators.treeNode,
                        endNode: cryo.treeNode
                    });
                }

                return b;
            },
            onReset() {
                particles.value = [flame.treeNode, life.treeNode, aqua.treeNode].some(
                    tn => toRaw(this.resettingNode.value) === toRaw(tn)
                )
                    ? 0
                    : 10;
                best.value = particles.value;
                total.value = particles.value;
            },
            resetPropagation: customResetPropagation
        };
    }) as GenericTree;

    return {
        name: "Tree",
        links: tree.links,
        display: jsx(() => (
            <>
                <div v-show={player.devSpeed === 0}>Game Paused</div>
                <div v-show={player.devSpeed && player.devSpeed !== 1}>
                    Dev Speed: {format(player.devSpeed || 0, 2)}x
                </div>
                <div v-show={player.offlineTime != undefined}>
                    Offline Time: {formatTime(player.offlineTime || 0)}
                </div>
                <div>
                    <span v-show={Decimal.lt(particles.value, "1e1000")}>You have </span>
                    <h2>{formatWhole(particles.value)}</h2>
                    <span v-show={Decimal.lt(particles.value, "1e1e6")}> particles</span>
                </div>
                <div
                    v-show={
                        Decimal.gt(baseGain.value, 0) &&
                        Decimal.neq(baseGain.value, particleGain.value)
                    }
                >
                    [Base Gain: {format(baseGain.value, 2)}/s
                    <span v-show={Decimal.gt(baseGainExp.value, 1)}>
                        &nbsp;&#x2192; {format(Decimal.pow(baseGain.value, baseGainExp.value), 2)}/s
                    </span>
                    ]
                </div>
                <div v-show={Decimal.gt(particleGain.value, 0)}>({oomps.value})</div>
                <Spacer />
                {render(tree)}
            </>
        )),
        particles,
        particleGain,
        baseGain,
        baseGainExp,
        best,
        total,
        oomps,
        tree
    };
});

export const getInitialLayers = (
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    player: Partial<PlayerData>
): Array<GenericLayer> => [
    main,
    flame,
    life,
    aqua,
    advancements,
    lightning,
    cryo,
    air,
    earth,
    combinators
];

export const hasWon = computed(() => {
    return Decimal.gte(main.particleGain.value, 1 / 0);
});

/* eslint-disable @typescript-eslint/no-unused-vars */
export function fixOldSave(
    oldVersion: string | undefined,
    player: Partial<PlayerData>
    // eslint-disable-next-line @typescript-eslint/no-empty-function
): void {}
/* eslint-enable @typescript-eslint/no-unused-vars */
