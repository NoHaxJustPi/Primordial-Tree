/**
 * @module
 * @hidden
 */

import { createLayerTreeNode, createResetButton } from "data/common";
import { main } from "data/projEntry";
import { createCumulativeConversion } from "features/conversion";
import { CoercableComponent, jsx, Visibility } from "features/feature";
import { createMilestone } from "features/milestones/milestone";
import { createReset } from "features/reset";
import MainDisplay from "features/resources/MainDisplay.vue";
import { createResource } from "features/resources/resource";
import { addTooltip } from "features/tooltips/tooltip";
import { Direction } from "util/common";
import { createResourceTooltip } from "features/trees/tree";
import { createLayer } from "game/layers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format } from "util/bignum";
import { formatWhole } from "util/break_eternity";
import { coerceComponent, render } from "util/vue";
import { computed, ComputedRef } from "vue";
import earth from "../row2/Earth";

const layer = createLayer("adv", () => {
    const id = "adv";
    const name = "Advancements";
    const color = "#ffffff";

    const reqs = [
        125,
        700,
        2e3,
        5e3,
        2.5e4,
        3.6e4,
        6e4,
        8.85e5,
        2.25e6,
        4.35e6,
        3.25e7,
        4.05e7,
        55555555,
        1e9,
        2.35e9,
        3.25e9,
        1e10,
        2e10,
        1.25e11,
        2.5e13,
        6e13,
        1e14,
        5e14,
        1e17,
        1.2e18,
        4e18,
        1.5e19,
        1e20,
        5e21,
        4.5e22,
        1.35e23,
        1e24,
        1.4e25,
        1e27,
        1.2e28,
        6e28,
        5e30,
        2.5e32,
        2.25e36,
        5e37,
        2e39,
        7.2e41,
        1.33e45,
        3.5e46,
        Decimal.dInf
    ];

    const advancements = createResource<number>(0, "Advancements");

    const conversion = createCumulativeConversion(() => ({
        scaling: {
            currentGain: conv =>
                Decimal.gte(
                    conv.baseResource.value,
                    reqs[new Decimal(conv.gainResource.value).toNumber()] || Decimal.dInf
                )
                    ? 1
                    : 0,
            currentAt: conv =>
                reqs[new Decimal(conv.gainResource.value).toNumber()] || Decimal.dInf,
            nextAt: conv => reqs[new Decimal(conv.gainResource.value).toNumber()] || Decimal.dInf
        },
        baseResource: main.particleGain,
        gainResource: advancements,
        roundUpCost: true,
        buyMax: false
    }));

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => [layer]
    }));

    const treeNode = createLayerTreeNode(() => ({
        layerID: id,
        display: "A",
        color,
        reset,
        glowColor: () => (Decimal.gt(conversion.actualGain.value, 0) ? "red" : "")
    }));
    addTooltip(treeNode, {
        display: createResourceTooltip(advancements),
        pinnable: true,
        direction: Direction.Right
    });

    const resetButton = createResetButton(() => ({
        conversion,
        baseResourceName: "particles/s",
        tree: main.tree,
        treeNode
    }));

    const adv5time = computed(() => {
        let time: DecimalSource = 120;

        if (milestones[8].earned.value)
            time = Decimal.sub(advancements.value, 7).times(30).plus(time);
        if (milestones[30].earned.value) time = Infinity;

        return time;
    });

    const adv15eff: ComputedRef<Decimal> = computed(() => {
        return Decimal.pow(2, Decimal.root(earth.gridLevel.value, 1.5));
    });

    const adv37eff = computed(() => Decimal.pow(1.2, Decimal.sub(advancements.value, 35)));

    function createAdvancement(adv: DecimalSource, desc: CoercableComponent) {
        const Display = coerceComponent(desc);
        return createMilestone(() => ({
            visibility: () =>
                Decimal.gte(advancements.value, adv) ? Visibility.Visible : Visibility.None,
            shouldEarn() {
                return Decimal.gte(advancements.value, adv);
            },
            display: {
                requirement: jsx(() => (
                    <>
                        <h3>{formatWhole(adv)} Advancement</h3>
                        <br />
                        <Display />
                    </>
                ))
            },
            style: {
                width: "30em"
            }
        }));
    }

    const milestones = [
        createAdvancement(1, "Unlock Lightning"),
        createAdvancement(2, "Unlock a new row of Flame Upgrades"),
        createAdvancement(3, "Unlock Cryo"),
        createAdvancement(4, "Gain 100% of Flame, Life, and Aqua Particles every second."),
        createAdvancement(
            5,
            jsx(() => (
                <>
                    Flame, Life, and Aqua Particle gain is tripled for the first{" "}
                    {formatWhole(adv5time.value)} seconds of a run.
                </>
            ))
        ),
        createAdvancement(6, "Unlock a new row of Life Buyables"),
        createAdvancement(7, "Unlock Air"),
        createAdvancement(8, "Unlock a new Aqua Bar"),
        createAdvancement(
            9,
            "The milestone at 5 Advancements lasts 30 seconds longer per Advancement after 7"
        ),
        createAdvancement(10, "Purchasing Life Buyables does not spend Life Particles"),
        createAdvancement(
            11,
            "The Air requirement uses a more efficient formula, you can buy max Air, and you can buy all Life Buyables at once."
        ),
        createAdvancement(12, "Unlock Earth, and all Aqua Bars are twice as fast."),
        createAdvancement(
            13,
            "Layers only reset along their branches, rather than by row (this does NOT affect Cryo Challenges)."
        ),
        createAdvancement(
            14,
            "After 1 second of a reset, all Flame Upgrades are automatically purchased if you can afford them."
        ),
        createAdvancement(
            15,
            jsx(() => (
                <>
                    Wind/Zephyr/Tornado Speeds work sublinearly (square root) rather than
                    logarithmically, and Aqua Bars are faster based on your Earth Grid Level (
                    {format(adv15eff.value)}x)
                </>
            ))
        ),
        createAdvancement(
            16,
            "Unlock Particle Combinators, gain 100% of Lightning Particle gain every second, and starting a Cryo Challenge only resets the Aqua layer."
        ),
        createAdvancement(17, "All Life Buyables are automatically purchased every second."),
        createAdvancement(18, "The Spark Molecule effect is cubed."),
        createAdvancement(19, "You can activate two Lightning Modes at once."),
        createAdvancement(20, "Unlock a new Aqua Bar."),
        createAdvancement(21, "Increase the Molecule limit by 20%."),
        createAdvancement(22, "Gain 100% of Air Particle gain every second."),
        createAdvancement(23, "Gain 100% of Cryo Particle gain every second."),
        createAdvancement(24, "Unlock Intrabonds."),
        createAdvancement(25, "Gain 100% of Earth Particle gain every second."),
        createAdvancement(26, "You can fill the Earth Grid with a single button."),
        createAdvancement(
            27,
            "Keep Cryo Challenge completions on all resets, and increase the completion limits of the first two Cryo Challenges by 10."
        ),
        createAdvancement(28, "The Wave requirement scales 50% slower."),
        createAdvancement(29, "Multiply Zephyr Speed and Tornado Speed by 10."),
        createAdvancement(
            30,
            'Square the effect of the "Liquid Fire", "Magma Spirit" and "Speed = Heat" upgrades.'
        ),
        createAdvancement(
            31,
            "The effect of the milestone at 5 Advancements is permanently active, and all Aqua bar requirements scale 10% slower."
        ),
        createAdvancement(
            32,
            "The main Combinator effect also affects the first row of Particles."
        ),
        createAdvancement(
            33,
            "Unlock Light & Sound, square the Particle Combinator effect, and Lightning Modes are never de-selected by resets."
        ),
        createAdvancement(
            34,
            "All Light Energy colors are generated twice as fast, and you can buy max Life Buyables."
        ),
        createAdvancement(
            35,
            "Increase the Molecule limit by 20%, and the Wood Molecule effect uses a better formula."
        ),
        createAdvancement(
            36,
            "Covalent/Ionic Bond costs scale 67% slower, and all Light Energy colors are generated 3x as fast."
        ),
        createAdvancement(
            37,
            jsx(() => (
                <>
                    Unlock Metallic Bonds, and all Light Energy colors are generated 20% faster for
                    every Advancement after 35 ({format(adv37eff.value)}x)
                </>
            ))
        ),
        createAdvancement(
            38,
            "Automatically level up and fill the Earth Grid if both are possible every second, and double Ultrasound gain."
        ),
        createAdvancement(
            39,
            "Color Energy Boosts only use up half of your Light Particles when used, and they last 50% longer."
        ),
        createAdvancement(40, "The amount of Magma Molecules are effectively squared."),
        createAdvancement(41, "You can max all Molecules at once."),
        createAdvancement(42, "All Light Energy colors are generated 4x as fast."),
        createAdvancement(
            43,
            "Color Energy boosts only use up 33% of your Light Particles when used, and they last 50% longer."
        ),
        createAdvancement(
            44,
            "Gain 10% of Light Particle gain every second, and you can activate all Color Energy boosts at once if you have unlocked all seven Color Energy types."
        )
    ];

    return {
        id,
        name,
        color,
        advancements,
        adv5time,
        adv15eff,
        adv37eff,
        display: jsx(() => (
            <>
                <MainDisplay resource={advancements} color={color} />
                {render(resetButton)}
                <br />
                <br />
                <table>
                    <tbody>
                        {milestones.map(m => (
                            <tr>
                                <td>{render(m)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </>
        )),
        treeNode,
        milestones
    };
});

export default layer;
