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
import { createResourceTooltip } from "features/trees/tree";
import { createLayer } from "game/layers";
import Decimal from "lib/break_eternity";
import { DecimalSource } from "util/bignum";
import { format } from "util/break_eternity";
import { render } from "util/vue";
import { computed } from "vue";
import { createLayerTreeNode, createResetButton } from "../common";
import advancements from "./Advancements";

const layer = createLayer("li", () => {
    const id = "li";
    const name = "Lightning";
    const color = "#ffd500";

    const lightning = createResource<DecimalSource>(0, "Lightning Particles");
    const best = trackBest(lightning);
    const lightningSel = createResource<number>(0);

    const conversion = createCumulativeConversion(() => ({
        scaling: createPolynomialScaling(2.5e3, 1 / 4),
        baseResource: main.particles,
        gainResource: lightning,
        roundUpCost: true
    }));

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

    const clickables = [
        createClickable(() => ({
            visibility: () => (Decimal.gte(best.value, 1) ? Visibility.Visible : Visibility.None),
            canClick: () => lightningSel.value != 0,
            onClick: _ => {
                lightningSel.value = 0;
            },
            display: () => ({
                title: "Lightning Mode A" + (lightningSel.value == 0 ? " (Active)" : ""),
                description:
                    "Increase Particle gain based on Lightning Particles (Currently: +" +
                    format(clickableEffects[0].value, 1) +
                    ")"
            })
        })),
        createClickable(() => ({
            visibility: () => (Decimal.gte(best.value, 1) ? Visibility.Visible : Visibility.None),
            canClick: () => lightningSel.value != 1,
            onClick: _ => {
                lightningSel.value = 1;
            },
            display: () => ({
                title: "Lightning Mode B" + (lightningSel.value == 1 ? " (Active)" : ""),
                description:
                    "Multiply Particle gain based on Lightning Particles (Currently: x" +
                    format(clickableEffects[1].value, 2) +
                    ")"
            })
        })),
        createClickable(() => ({
            visibility: () => (Decimal.gte(best.value, 2) ? Visibility.Visible : Visibility.None),
            canClick: () => lightningSel.value != 2,
            onClick: _ => {
                lightningSel.value = 2;
            },
            display: () => ({
                title: "Lightning Mode C" + (lightningSel.value == 2 ? " (Active)" : ""),
                description:
                    "Multiply Flame, Life, & Aqua Particle gain based on Lightning Particles (Currently: x" +
                    format(clickableEffects[2].value, 2) +
                    ")"
            })
        })),
        createClickable(() => ({
            visibility: () => (Decimal.gte(best.value, 5) ? Visibility.Visible : Visibility.None),
            canClick: () => lightningSel.value != 3,
            onClick: _ => {
                lightningSel.value = 3;
            },
            display: jsx(() => (
                <div>
                    <h3>Lightning Mode D{lightningSel.value == 3 ? " (Active)" : ""}</h3>
                    <br />
                    Multiply Particle gain based on Particles & Lightning Particles (Currently: x
                    {format(clickableEffects[3].value, 2)})
                </div>
            ))
        }))
    ];

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => [layer]
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
