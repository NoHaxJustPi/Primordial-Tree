/**
 * @module
 * @hidden
 */
import { main } from "data/projEntry";
import { createClickable } from "features/clickables/clickable";
import { createCumulativeConversion, createPolynomialScaling } from "features/conversion";
import { jsx, Visibility } from "features/feature";
import { createReset } from "features/reset";
import MainDisplay from "features/resources/MainDisplay.vue";
import { createResource, trackBest } from "features/resources/resource";
import { addTooltip } from "features/tooltips/tooltip";
import { Direction } from "util/common";
import { createResourceTooltip } from "features/trees/tree";
import { globalBus } from "game/events";
import { createLayer } from "game/layers";
import {
    createModifierSection,
    createMultiplicativeModifier,
    createSequentialModifier
} from "game/modifiers";
import Decimal from "lib/break_eternity";
import { DecimalSource } from "util/bignum";
import { format } from "util/break_eternity";
import { render } from "util/vue";
import { computed } from "vue";
import { createLayerTreeNode, createResetButton } from "../../common";
import advancements from "../side/Advancements";
import combinators from "../row4/Combinators";
import light from "../row3/Light";

const layer = createLayer("li", () => {
    const id = "li";
    const name = "Lightning";
    const color = "#ffd500";

    const lightning = createResource<DecimalSource>(0, "Lightning Particles");
    const best = trackBest(lightning);
    const lightningSel = {
        0: createResource<boolean>(false),
        1: createResource<boolean>(false),
        2: createResource<boolean>(false),
        3: createResource<boolean>(false)
    };

    const conversion = createCumulativeConversion(() => ({
        scaling: createPolynomialScaling(2.5e3, 1 / 4),
        baseResource: main.particles,
        gainResource: lightning,
        roundUpCost: true,
        gainModifier: createSequentialModifier(
            createMultiplicativeModifier(
                combinators.mainEff,
                "Particle Combinator Effect",
                advancements.milestones[15].earned
            ),
            createMultiplicativeModifier(
                light.lightBuyableEffects[2][1],
                "Yellow Energy Buyable 2",
                () => Decimal.gte(light.lights[2].buyables[1].amount.value, 1)
            )
        )
    }));

    globalBus.on("update", diff => {
        const spd = player.devSpeed ?? 1
        if (advancements.milestones[15].earned.value) {
            lightning.value = Decimal.mul(conversion.currentGain.value, 1e4*spd);
        }
    });

    const clickableEffects = {
        0: computed(() => Decimal.add(lightning.value, 1).log2().times(2)),
        1: computed(() => {
            let ret = Decimal.add(lightning.value, 1).sqrt();

            if (ret.gte(100)) ret = ret.log(100).times(100);

            return ret;
        }),
        2: computed(() => Decimal.add(lightning.value, 1).log(3).plus(1).sqrt()),
        3: computed(() =>
            Decimal.add(lightning.value, 1)
                .log10()
                .times(Decimal.add(main.particles.value, 1).sqrt())
                .plus(1)
                .log10()
                .plus(1)
        )
    };

    const lightningSelLimit = computed(() => {
        return advancements.milestones[18].earned.value ? 2 : 1;
    });

    const clickables = [
        createClickable(() => ({
            visibility: () => (Decimal.gte(best.value, 1) ? Visibility.Visible : Visibility.None),
            canClick: () => !lightningSel[0].value,
            onClick: _ => {
                lightningSel[0].value = true;

                if (
                    Object.values(lightningSel).filter(res => res.value).length >
                    lightningSelLimit.value
                ) {
                    lightningSel[1].value = false;
                    lightningSel[2].value = false;
                    lightningSel[3].value = false;
                }
            },
            display: jsx(() => (
                <>
                    <h3>Lightning Mode A {lightningSel[0].value ? "(Active)" : ""}</h3>
                    <br />
                    Increase Particle gain based on Lightning Particles (Currently: +
                    {format(clickableEffects[0].value, 1)})
                </>
            ))
        })),
        createClickable(() => ({
            visibility: () => (Decimal.gte(best.value, 1) ? Visibility.Visible : Visibility.None),
            canClick: () => !lightningSel[1].value,
            onClick: _ => {
                lightningSel[1].value = true;

                if (
                    Object.values(lightningSel).filter(res => res.value).length >
                    lightningSelLimit.value
                ) {
                    lightningSel[0].value = false;
                    lightningSel[2].value = false;
                    lightningSel[3].value = false;
                }
            },
            display: jsx(() => (
                <>
                    <h3>Lightning Mode B {lightningSel[1].value ? "(Active)" : ""}</h3>
                    <br />
                    Multiply Particle gain based on Lightning Particles (Currently: x
                    {format(clickableEffects[1].value, 2)})
                </>
            ))
        })),
        createClickable(() => ({
            visibility: () => (Decimal.gte(best.value, 2) ? Visibility.Visible : Visibility.None),
            canClick: () => !lightningSel[2].value,
            onClick: _ => {
                lightningSel[2].value = true;

                if (
                    Object.values(lightningSel).filter(res => res.value).length >
                    lightningSelLimit.value
                ) {
                    lightningSel[0].value = false;
                    lightningSel[1].value = false;
                    lightningSel[3].value = false;
                }
            },
            display: jsx(() => (
                <>
                    <h3>Lightning Mode C {lightningSel[2].value ? "(Active)" : ""}</h3>
                    <br />
                    Multiply Flame, Life, and Aqua Particle gain based on Lightning Particles
                    (Currently: x{format(clickableEffects[2].value, 2)})
                </>
            ))
        })),
        createClickable(() => ({
            visibility: () => (Decimal.gte(best.value, 5) ? Visibility.Visible : Visibility.None),
            canClick: () => !lightningSel[3].value,
            onClick: _ => {
                lightningSel[3].value = true;

                if (
                    Object.values(lightningSel).filter(res => res.value).length >
                    lightningSelLimit.value
                ) {
                    lightningSel[0].value = false;
                    lightningSel[1].value = false;
                    lightningSel[2].value = false;
                }
            },
            display: jsx(() => (
                <>
                    <h3>Lightning Mode D {lightningSel[3].value ? "(Active)" : ""}</h3>
                    <br />
                    Multiply Particle gain based on Particles and Lightning Particles (Currently: x
                    {format(clickableEffects[3].value, 2)})
                </>
            ))
        }))
    ];

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => {
            const toReset = {
                id,
                name,
                color,
                lightning,
                best,
                treeNode,
                clickables,
                clickableEffects
            };

            if (!advancements.milestones[32].earned.value) return [{ ...toReset, lightningSel }];

            return [toReset];
        }
    }));

    const treeNode = createLayerTreeNode(() => ({
        visibility: () =>
            advancements.milestones[0].earned.value ? Visibility.Visible : Visibility.Hidden,
        layerID: id,
        display: jsx(() => <img src="./nodes/lightning.png" />),
        color,
        reset
    }));
    addTooltip(treeNode, {
        display: createResourceTooltip(lightning),
        pinnable: true,
        style: () => (treeNode.visibility.value === Visibility.Visible ? "" : "display: none")
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
                conversion.gainModifier!,
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
        lightning,
        best,
        lightningSel,
        display: jsx(() => (
            <>
                <MainDisplay resource={lightning} color={color} />
                {render(resetButton)}
                <br />
                <br />
                <table>
                    <tbody>
                        <tr>
                            {clickables.map(clk => (
                                <td>{render(clk)}</td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </>
        )),
        treeNode,
        clickables,
        clickableEffects
    };
});

export default layer;
