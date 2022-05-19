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
import advancements from "./layers/side/Advancements";
import lightning from "./layers/row2/Lightning";
import cryo from "./layers/row2/Cryo";
import air from "./layers/row2/Air";
import earth from "./layers/row2/Earth";
import light from "./layers/row3/Light";
import sound from "./layers/row3/Sound";
import { oneWayBranchedResetPropagation, versionGT, fixPoint4Obj, emptyTreeNode } from "./helpers";
import combinators from "./layers/row4/Combinators";
import projInfo from "./projInfo.json";
import lore from "./layers/side/Lore";

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
        if (lightning.lightningSel[0].value) gain = gain.plus(lightning.clickableEffects[0].value);
        gain = gain.plus(earth.baseGainAdded.value);
        gain = gain.plus(combinators.multiBuyableEffects[0].value);

        if (advancements.milestones[32].earned.value)
            gain = gain.plus(light.lightBuyableEffects[1][1].value);

        return gain;
    });

    const baseGainExp = computed(() => {
        let exp = Decimal.dOne;

        exp = exp.times(air.tornadoEff.value);

        if (advancements.milestones[19].earned.value)
            exp = exp.plus(Decimal.mul(0.05, Decimal.floor(aqua.floods.value)));

        return exp;
    });

    const particleGain = computed(() => {
        const base = baseGain.value;
        let gain = Decimal.pow(base, baseGainExp.value);

        if (flame.upgradesR1[1].bought.value) gain = gain.times(flame.upgradeEffects[1].value);
        gain = gain.times(life.buyableEffects[1].value);
        if (lightning.lightningSel[1].value) gain = gain.times(lightning.clickableEffects[1].value);
        if (lightning.lightningSel[3].value) gain = gain.times(lightning.clickableEffects[3].value);
        if (advancements.milestones[7].earned.value)
            gain = gain.times(
                Decimal.pow(aqua.torrentEff.value.plus(1), Decimal.floor(aqua.torrents.value))
            );
        if (
            Decimal.gte(combinators.multiBuyables[1].value, 1) &&
            advancements.milestones[15].earned.value
        )
            gain = gain.times(combinators.multiBuyableEffects[1].value);

        if (Decimal.gte(earth.gridLevel.value, 16)) gain = gain.times(earth.particleGainMult.value);

        if (advancements.milestones[32].earned.value)
            gain = gain.times(light.lightBuyableEffects[0][1].value);

        return gain;
    });

    globalBus.on("update", diff => {
        const spd = player.devSpeed ?? 1
        particles.value = Decimal.times(particleGain.value, 1e4*spd);
        if (particleGain.value == 0) {
            particles.value = new Decimal(10)
        }
    });
    const oomps = trackOOMPS(particles, particleGain);

    const tree = createTree(() => {
        return {
            nodes: [
                [flame.treeNode, life.treeNode, aqua.treeNode],
                [earth.treeNode, lightning.treeNode, air.treeNode, cryo.treeNode],
                [light.treeNode, emptyTreeNode, sound.treeNode],
                [combinators.treeNode]
            ],
            leftSideNodes: [advancements.treeNode, lore.treeNode],
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

                if (light.treeNode.visibility.value == Visibility.Visible) {
                    b.push({
                        startNode: light.treeNode,
                        endNode: lightning.treeNode,
                        stroke: "#999999"
                    });
                }

                if (sound.treeNode.visibility.value == Visibility.Visible) {
                    b.push({
                        startNode: sound.treeNode,
                        endNode: air.treeNode,
                        stroke: "#999999"
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
    lore,
    lightning,
    cryo,
    air,
    earth,
    combinators,
    light,
    sound
];

export const hasWon = computed(() => {
    return Decimal.gte(main.particleGain.value, Decimal.dInf);
});

/* eslint-disable @typescript-eslint/no-unused-vars */
export function fixOldSaveEarly(
    oldVersion: string | undefined,
    player: Partial<PlayerData>
    // eslint-disable-next-line @typescript-eslint/no-empty-function
): void {
    if (versionGT("1.1", oldVersion)) {
        if (
            player?.layers?.li?.lightningSel !== undefined &&
            typeof player.layers.li.lightningSel == typeof Number
        ) {
            player.layers.li.lightningSel = {
                0: player.layers.li.lightningSel == 0,
                1: player.layers.li.lightningSel == 1,
                2: player.layers.li.lightningSel == 2,
                3: player.layers.li.lightningSel == 3
            };
        }

        if (player?.layers?.f?.upgradesR1 !== undefined)
            player.layers.f.upgradesR1 = fixPoint4Obj(player.layers.f.upgradesR1);

        if (player?.layers?.f?.upgradesR2 !== undefined)
            player.layers.f.upgradesR2 = fixPoint4Obj(player.layers.f.upgradesR2);

        if (player?.layers?.l?.buyables !== undefined)
            player.layers.l.buyables = fixPoint4Obj(player.layers.l.buyables);

        if (player?.layers?.e?.grid !== undefined)
            player.layers.e.grid = fixPoint4Obj(player.layers.e.grid);

        if (player?.layers?.adv?.milestones !== undefined)
            player.layers.adv.milestones = fixPoint4Obj(player.layers.adv.milestones);
    }
}
/* eslint-enable @typescript-eslint/no-unused-vars */

/* eslint-disable @typescript-eslint/no-unused-vars */
export function fixOldSave(
    oldVersion: string | undefined,
    player: Partial<PlayerData>
    // eslint-disable-next-line @typescript-eslint/no-empty-function
): void {
    player.modVersion = projInfo.versionNumber;
}
/* eslint-enable @typescript-eslint/no-unused-vars */
