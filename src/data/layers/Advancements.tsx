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
import { addTooltip, TooltipDirection } from "features/tooltips/tooltip";
import { createResourceTooltip } from "features/trees/tree";
import { createLayer } from "game/layers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format } from "util/bignum";
import { formatWhole } from "util/break_eternity";
import { coerceComponent, render } from "util/vue";
import { computed, ComputedRef } from "vue";
import earth from "./Earth";

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
        1 / 0
    ];

    const advancements = createResource<number>(0, "Advancements");

    const conversion = createCumulativeConversion(() => ({
        scaling: {
            currentGain: conv =>
                Decimal.gte(
                    conv.baseResource.value,
                    reqs[new Decimal(conv.gainResource.value).toNumber()]
                )
                    ? 1
                    : 0,
            currentAt: conv => reqs[new Decimal(conv.gainResource.value).toNumber()],
            nextAt: conv => reqs[new Decimal(conv.gainResource.value).toNumber()]
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
        direction: TooltipDirection.RIGHT
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

        return time;
    });

    const adv15eff: ComputedRef<Decimal> = computed(() => {
        return Decimal.pow(2, Decimal.root(earth.gridLevel.value, 1.5));
    });

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
        )
    ];

    return {
        id,
        name,
        color,
        advancements,
        adv5time,
        adv15eff,
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
