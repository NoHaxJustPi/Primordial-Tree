/**
 * @module
 * @hidden
 */
import { createLayerTreeNode, createResetButton } from "data/common";
import { createExponentialScaling } from "data/helpers";
import { main } from "data/projEntry";
import { createIndependentConversion } from "features/conversion";
import { Visibility, jsx, showIf } from "features/feature";
import { createReset } from "features/reset";
import { createResource, trackBest } from "features/resources/resource";
import { addTooltip } from "features/tooltips/tooltip";
import { createResourceTooltip } from "features/trees/tree";
import { createLayer } from "game/layers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { render } from "util/vue";
import advancements from "../side/Advancements";
import MainDisplay from "features/resources/MainDisplay.vue";
import { computed, ComputedRef } from "vue";
import { format } from "util/bignum";
import flame from "../row1/Flame";
import lightning from "../row2/Lightning";
import life from "../row1/Life";
import aqua from "../row1/Aqua";
import earth from "../row2/Earth";
import air from "../row2/Air";
import cryo from "../row2/Cryo";
import {
    createMultiBuyable,
    MultiBuyable,
    MultiBuyableOptions
} from "data/customFeatures/multiBuyable";
import { Computable } from "util/computed";

const layer = createLayer("comb", () => {
    const id = "comb";
    const name = "Combinators";
    const color = "#03fca9";

    const combinators = createResource<DecimalSource>(0, "Particle Combinators");
    const best = trackBest(combinators);

    const mainEff = computed(() => {
        return Decimal.sqrt(combinators.value).plus(1);
    });

    const conversion = createIndependentConversion(() => ({
        scaling: createExponentialScaling(1e11, 4, 2),
        baseResource: main.particles,
        gainResource: combinators,
        roundUpCost: true
    }));

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => [layer]
    }));

    const treeNode = createLayerTreeNode(() => ({
        visibility: () =>
            advancements.milestones[15].earned.value ? Visibility.Visible : Visibility.Hidden,
        layerID: id,
        display: jsx(() => <img src="./nodes/combinators.png" />),
        color,
        reset,
        style: {
            transform: "scale(1.5)"
        },
        glowColor: () =>
            multiBuyables.some(bbl => bbl.canPurchase.value && Decimal.lt(bbl.amount.value, 1)) ||
            Decimal.gt(conversion.currentGain.value, combinators.value)
                ? "red"
                : ""
    }));
    addTooltip(treeNode, {
        display: createResourceTooltip(combinators),
        pinnable: true,
        style: () => (treeNode.visibility.value === Visibility.Visible ? "" : "display: none")
    });

    const resetButton = createResetButton(() => ({
        conversion,
        tree: main.tree,
        treeNode
    }));

    const moleculeLimit = computed(() => {
        let limit = Decimal.mul(50, combinators.value);
        if (advancements.milestones[20].earned.value) limit = limit.times(1.2);
        return limit;
    });

    const multiBuyableEffects: { [key: number]: ComputedRef<DecimalSource> } = {
        0: computed(() => {
            let eff = Decimal.add(flame.flame.value, 1)
                .log10()
                .times(multiBuyables[0].amount.value)
                .plus(1)
                .log10();
            if (advancements.milestones[17].earned.value) eff = eff.pow(3);
            return eff;
        }),
        1: computed(() =>
            Decimal.add(earth.earth.value, 1)
                .log10()
                .times(Decimal.pow(multiBuyables[1].amount.value, 1.5))
                .plus(1)
                .cbrt()
        ),
        2: computed(() =>
            Decimal.add(
                Decimal.mul(
                    combinators.value,
                    Decimal.add(multiBuyables[2].amount.value, 1).log10()
                ),
                1
            )
                .log10()
                .plus(1)
                .sqrt()
        ),
        3: computed(() =>
            Decimal.add(air.air.value, 1)
                .log10()
                .times(multiBuyables[3].amount.value)
                .plus(1)
                .log10()
                .div(2)
                .plus(1)
        )
    };

    const multiBuyables: MultiBuyable<
        MultiBuyableOptions & {
            visibility: Computable<Visibility>;
            purchaseLimit: Computable<DecimalSource>;
        }
    >[] = [
        createMultiBuyable(() => ({
            visibility: () => showIf(Decimal.gte(best.value, 1)),
            costSets: [
                {
                    cost: 1e6,
                    resource: flame.flame
                },
                {
                    cost: 1e4,
                    resource: lightning.lightning
                }
            ],
            display: () => ({
                title: "Spark Molecule",
                description: "Increase Base Particle gain based on Flame Particles.",
                effectDisplay: "+" + format(multiBuyableEffects[0].value)
            }),
            purchaseLimit: moleculeLimit
        })),
        createMultiBuyable(() => ({
            visibility: () => showIf(Decimal.gte(best.value, 1)),
            costSets: [
                {
                    cost: 2.5e6,
                    resource: aqua.aqua
                },
                {
                    cost: 100,
                    resource: earth.earth
                }
            ],
            display: () => ({
                title: "Mud Molecule",
                description: "Multiply Particle & Aqua Particle gain based on Earth Particles.",
                effectDisplay: format(multiBuyableEffects[1].value) + "x"
            }),
            purchaseLimit: moleculeLimit
        })),
        createMultiBuyable(() => ({
            visibility: () => showIf(Decimal.gte(best.value, 2)),
            costSets: [
                {
                    cost: 1e8,
                    resource: life.life
                },
                {
                    cost: 1e5,
                    resource: lightning.lightning
                },
                {
                    cost: 500,
                    resource: earth.earth
                }
            ],
            display: () => ({
                title: "Protein Molecule",
                description: "Increase Life Buyable Power based on Combinators.",
                effectDisplay:
                    "+" + format(Decimal.sub(multiBuyableEffects[2].value, 1).times(100)) + "%"
            }),
            purchaseLimit: moleculeLimit
        })),
        createMultiBuyable(() => ({
            visibility: () => showIf(Decimal.gte(best.value, 3)),
            costSets: [
                {
                    cost: 5e9,
                    resource: aqua.aqua
                },
                {
                    cost: 1e8,
                    resource: cryo.cryo
                },
                {
                    cost: 1e5,
                    resource: air.air
                }
            ],
            display: () => ({
                title: "Snow Molecule",
                description:
                    'Boost the effect of the "Full Freeze" challenge based on Air Particles.',
                effectDisplay: "^" + format(multiBuyableEffects[3].value)
            }),
            purchaseLimit: moleculeLimit
        }))
    ];

    return {
        id,
        name,
        color,
        combinators,
        best,
        multiBuyables,
        multiBuyableEffects,
        mainEff,
        display: jsx(() => {
            const combDisplay = multiBuyables.map(render);

            return (
                <>
                    <MainDisplay resource={combinators} color={color} />
                    {render(resetButton)} <br />
                    <br />
                    Multiplies Earth, Lightning, Air, and Cryo Particles by {format(mainEff.value)}.
                    <br />
                    <br />
                    {combDisplay}
                </>
            );
        }),
        treeNode
    };
});

export default layer;
