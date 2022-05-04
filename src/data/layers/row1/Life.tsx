/**
 * @module
 * @hidden
 */
import { main } from "data/projEntry";
import {
    Conversion,
    ConversionOptions,
    createCumulativeConversion,
    createPolynomialScaling
} from "features/conversion";
import { jsx, Visibility } from "features/feature";
import { createReset } from "features/reset";
import MainDisplay from "features/resources/MainDisplay.vue";
import { createResource, Resource, trackBest } from "features/resources/resource";
import { createLayer } from "game/layers";
import Decimal, { DecimalSource, formatWhole } from "util/bignum";
import { render } from "util/vue";
import { createLayerTreeNode, createResetButton } from "../../common";
import { createBuyable, Buyable, BuyableDisplay } from "features/buyable";
import { computed, ComputedRef, unref } from "vue";
import { format } from "util/break_eternity";
import { Computable } from "util/computed";
import advancements from "../Advancements";
import flame from "./Flame";
import lightning from "../row2/Lightning";
import cryo from "../row2/Cryo";
import air from "../row2/Air";
import earth from "../row2/Earth";
import combinators from "../row3/Combinators";
import { globalBus } from "game/events";
import { createClickable } from "features/clickables/clickable";
import { addTooltip } from "features/tooltips/tooltip";
import { Direction } from "util/common";
import { createResourceTooltip } from "features/trees/tree";
import {
    createModifierSection,
    createMultiplicativeModifier,
    createSequentialModifier,
    Modifier
} from "game/modifiers";

const layer = createLayer("l", () => {
    const id = "l";
    const name = "Life";
    const color = "#32a85e";

    const life = createResource<DecimalSource>(0, "Life Particles");
    const best = trackBest(life);

    const time = createResource<number>(0);
    const autoTime = createResource<number>(0);

    const baseReq = computed(() => {
        let base = 10;

        if (cryo.challenges[1].active.value) base = 1 / 0;

        return base;
    });

    const conversion: Conversion<ConversionOptions & { gainModifier: Required<Modifier> }> =
        createCumulativeConversion(() => ({
            scaling: createPolynomialScaling(baseReq, 1 / 3),
            baseResource: main.particles,
            gainResource: life,
            roundUpCost: true,
            gainModifier: createSequentialModifier(
                createMultiplicativeModifier(
                    buyableEffects[3],
                    "Life Buyable 4",
                    advancements.milestones[5].earned
                ),
                createMultiplicativeModifier(
                    lightning.clickableEffects[2],
                    "Lightning Mode C",
                    () => lightning.lightningSel[2].value
                ),
                createMultiplicativeModifier(
                    3,
                    "Advancement 5",
                    () =>
                        advancements.milestones[4].earned.value &&
                        Decimal.lte(time.value, advancements.adv5time.value)
                ),
                createMultiplicativeModifier(
                    air.windEff,
                    "Wind Effect",
                    advancements.milestones[6].earned
                )
            )
        }));

    globalBus.on("update", diff => {
        if (advancements.milestones[3].earned.value)
            life.value = Decimal.mul(conversion.currentGain.value, diff).plus(life.value);
        time.value += diff;
        autoTime.value += diff;

        if (advancements.milestones[16].earned.value && autoTime.value >= 1) {
            autoTime.value = 0;
            buyAll.onClick(undefined);
        }
    });

    const buyablePower = computed(() => {
        let power: DecimalSource = 1;

        if (Decimal.gte(combinators.best.value, 2))
            power = combinators.multiBuyableEffects[2].value;

        return power;
    });

    const extraBuyableLevelsAll = computed(() => {
        return air.zephyrEff.value;
    });

    const extraBuyableLevels: ComputedRef<DecimalSource>[] = [
        computed(() => {
            let lvl = buyableEffects[5].value;

            if (flame.upgradesR2[0].bought.value) lvl = lvl.plus(flame.upgradeEffects[3].value);

            return lvl.plus(extraBuyableLevelsAll.value);
        }),
        computed(() => Decimal.add(buyableEffects[5].value, extraBuyableLevelsAll.value)),
        computed(() => Decimal.add(buyableEffects[5].value, extraBuyableLevelsAll.value)),
        computed(() => Decimal.add(buyableEffects[5].value, extraBuyableLevelsAll.value)),
        computed(() => Decimal.add(buyableEffects[5].value, extraBuyableLevelsAll.value)),
        computed(() => extraBuyableLevelsAll.value)
    ];

    const buyableEffects = {
        0: computed(() =>
            Decimal.add(buyables[0].amount.value, extraBuyableLevels[0].value).times(
                buyablePower.value
            )
        ),
        1: computed(() =>
            Decimal.pow(
                2,
                Decimal.add(buyables[1].amount.value, extraBuyableLevels[1].value).times(
                    buyablePower.value
                )
            )
        ),
        2: computed(() =>
            Decimal.mul(
                2,
                Decimal.add(buyables[2].amount.value, extraBuyableLevels[2].value).times(
                    buyablePower.value
                )
            )
        ),
        3: computed(() =>
            Decimal.pow(
                1.15,
                Decimal.add(buyables[3].amount.value, extraBuyableLevels[3].value).times(
                    buyablePower.value
                )
            )
        ),
        4: computed(() =>
            Decimal.pow(
                2.25,
                Decimal.add(buyables[4].amount.value, extraBuyableLevels[4].value).times(
                    buyablePower.value
                )
            )
        ),
        5: computed(() =>
            Decimal.add(main.particleGain.value, 1)
                .log10()
                .times(
                    Decimal.add(buyables[5].amount.value, extraBuyableLevels[5].value).times(
                        buyablePower.value
                    )
                )
                .plus(1)
                .log10()
                .div(5)
                .times(earth.lb6Mult.value)
        )
    };

    const buyableCostDiv = computed(() => {
        let div = Decimal.dOne;

        div = div.times(cryo.challenge2Data.reward.value);

        return div;
    });

    const buyableCostExp = computed(() => {
        let exp = Decimal.dOne;

        if (cryo.challenges[0].active.value)
            exp = exp.times(cryo.challenge1Data.lifeBuyableCosts.value);
        if (cryo.challenges[2].active.value) exp = exp.times(cryo.challenge3Data.exp.value);

        return exp;
    });

    const buyAll = createClickable(() => ({
        visibility: () =>
            advancements.milestones[10].earned.value ? Visibility.Visible : Visibility.None,
        canClick: () => advancements.milestones[10].earned.value,
        display: "Buy All",
        small: true,
        onClick: _ => {
            for (let i = 0; i < buyables.length; i++) {
                if (unref(buyables[i].canClick)) buyables[i].onClick();
            }
        }
    }));

    const buyables: Array<
        Buyable<{
            visibility: () => Visibility.Visible | Visibility.None;
            cost(): Decimal;
            resource: Resource<DecimalSource>;
            display: Computable<BuyableDisplay>;
        }>
    > = [
        createBuyable(() => ({
            visibility: () => (Decimal.gt(best.value, 0) ? Visibility.Visible : Visibility.None),
            cost() {
                const amt = buyables[0].amount.value;
                return Decimal.pow(3, amt).div(buyableCostDiv.value).pow(buyableCostExp.value);
            },
            resource: life,
            display: () => ({
                title: "Regeneration",
                description: "Generate 1 Particle/second.",
                effectDisplay: "+" + formatWhole(buyableEffects[0].value)
            }),
            keepRes: () => advancements.milestones[9].earned.value
        })),
        createBuyable(() => ({
            visibility: () =>
                Decimal.gt(buyables[0].amount.value, 0) ? Visibility.Visible : Visibility.None,
            cost() {
                const amt = buyables[1].amount.value;
                return Decimal.pow(4, Decimal.pow(amt, 1.2))
                    .times(10)
                    .div(buyableCostDiv.value)
                    .pow(buyableCostExp.value);
            },
            resource: life,
            display: () => ({
                title: "The Source",
                description: "Double Particle gain.",
                effectDisplay: format(buyableEffects[1].value) + "x"
            }),
            keepRes: () => advancements.milestones[9].earned.value
        })),
        createBuyable(() => ({
            visibility: () =>
                Decimal.gt(buyables[1].amount.value, 0) ? Visibility.Visible : Visibility.None,
            cost() {
                const amt = buyables[2].amount.value;
                return Decimal.pow(2.5, Decimal.pow(amt, 1.4))
                    .times(50)
                    .div(buyableCostDiv.value)
                    .pow(buyableCostExp.value);
            },
            resource: life,
            display: () => ({
                title: "Solar Warmth",
                description: "Flame Upgrade 1's effect increases by 2.",
                effectDisplay: "+" + formatWhole(buyableEffects[2].value)
            }),
            keepRes: () => advancements.milestones[9].earned.value
        })),
        createBuyable(() => ({
            visibility: () =>
                advancements.milestones[5].earned.value ? Visibility.Visible : Visibility.None,
            cost() {
                const amt = buyables[3].amount.value;
                return Decimal.pow(2, Decimal.pow(amt, 1.6))
                    .times(200)
                    .div(buyableCostDiv.value)
                    .pow(buyableCostExp.value);
            },
            resource: life,
            display: () => ({
                title: "Existence Formula",
                description: "Increase Life Particle gain by 15%.",
                effectDisplay: format(buyableEffects[3].value, 2) + "x"
            }),
            keepRes: () => advancements.milestones[9].earned.value
        })),
        createBuyable(() => ({
            visibility: () =>
                Decimal.gt(buyables[3].amount.value, 0) ? Visibility.Visible : Visibility.None,
            cost() {
                const amt = buyables[4].amount.value;
                return Decimal.pow(1.5, Decimal.pow(amt, 1.8))
                    .times(1e4)
                    .div(buyableCostDiv.value)
                    .pow(buyableCostExp.value);
            },
            resource: life,
            display: () => ({
                title: "Water Lily",
                description: "Make the Bubble bar 125% faster.",
                effectDisplay: format(buyableEffects[4].value, 2) + "x"
            }),
            keepRes: () => advancements.milestones[9].earned.value
        })),
        createBuyable(() => ({
            visibility: () =>
                Decimal.gt(buyables[4].amount.value, 0) ? Visibility.Visible : Visibility.None,
            cost() {
                const amt = buyables[5].amount.value;
                return Decimal.pow(2, Decimal.pow(2, amt))
                    .times(1.2e4)
                    .div(buyableCostDiv.value)
                    .pow(buyableCostExp.value);
            },
            resource: life,
            display: () => ({
                title: "Purest Form",
                description: "Add levels to all previous Life Buyables based on Particle gain.",
                effectDisplay: "+" + format(buyableEffects[5].value, 2)
            }),
            keepRes: () => advancements.milestones[9].earned.value
        }))
    ];

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => [layer]
    }));

    const treeNode = createLayerTreeNode(() => ({
        layerID: id,
        display: jsx(() => <img src="./nodes/life.png" />),
        color,
        reset,
        glowColor: () => (buyables.some(b => b.canPurchase.value) ? "red" : "")
    }));
    addTooltip(treeNode, {
        display: createResourceTooltip(life),
        pinnable: true
    });

    const resetButton = createResetButton(() => ({
        conversion,
        tree: main.tree,
        treeNode
    }));
    addTooltip(resetButton, {
        display: jsx(() =>
            createModifierSection(
                "Modifiers",
                "",
                conversion.gainModifier,
                conversion.scaling.currentGain(conversion)
            )
        ),
        pinnable: true,
        direction: Direction.Down,
        style: "width: 400px; text-align: left"
    });

    return {
        id,
        name,
        color,
        life,
        best,
        time,
        autoTime,
        buyableEffects,
        display: jsx(() => (
            <>
                <MainDisplay resource={life} color={color} />
                {render(resetButton)}
                <br />
                <br />
                <div v-show={Decimal.gt(buyablePower.value, 1)}>
                    <b>Buyable Power: {format(Decimal.mul(buyablePower.value, 100))}%</b>
                </div>
                {render(buyAll)}
                <table>
                    <tbody>
                        <tr>
                            <td>{render(buyables[0])}</td>
                            <td>{render(buyables[1])}</td>
                            <td>{render(buyables[2])}</td>
                        </tr>
                        <tr>
                            <td>{render(buyables[3])}</td>
                            <td>{render(buyables[4])}</td>
                            <td>{render(buyables[5])}</td>
                        </tr>
                    </tbody>
                </table>
            </>
        )),
        treeNode,
        buyables
    };
});

export default layer;
