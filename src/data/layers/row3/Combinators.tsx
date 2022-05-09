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
import { computed, ComputedRef, unref } from "vue";
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
import { createTab } from "features/tabs/tab";
import { createTabFamily, TabFamily, TabFamilyOptions } from "features/tabs/tabFamily";
import { globalBus } from "game/events";
import { Buyable, BuyableOptions, createBuyable } from "features/buyable";
import { formatWhole } from "util/break_eternity";

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
        let comb = combinators.value;
        if (Decimal.gte(comb, 10)) comb = Decimal.mul(comb, 10).sqrt();
        let limit = Decimal.mul(50, comb);
        if (advancements.milestones[20].earned.value) limit = limit.times(1.2);
        return limit;
    });

    const multiBuyableEffects: { [key: number]: ComputedRef<DecimalSource> } = {
        0: computed(() => {
            let eff = Decimal.add(flame.flame.value, 1)
                .log10()
                .times(multiBuyables[0].amount.value)
                .times(attractionEff.value)
                .plus(1)
                .log10();
            if (advancements.milestones[17].earned.value) eff = eff.pow(3);
            return eff;
        }),
        1: computed(() =>
            Decimal.add(earth.earth.value, 1)
                .log10()
                .times(Decimal.mul(multiBuyables[1].amount.value, attractionEff.value).pow(1.5))
                .plus(1)
                .cbrt()
        ),
        2: computed(() =>
            Decimal.add(
                Decimal.mul(
                    combinators.value,
                    Decimal.mul(multiBuyables[2].amount.value, attractionEff.value).plus(1).log10()
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
                .times(attractionEff.value)
                .plus(1)
                .log10()
                .div(2)
                .plus(1)
        ),
        4: computed(() =>
            Decimal.add(main.baseGain.value, 1)
                .log10()
                .times(multiBuyables[4].amount.value)
                .times(attractionEff.value)
                .plus(1)
                .log10()
                .div(5)
                .plus(1)
        ),
        5: computed(() =>
            Decimal.add(
                Decimal.mul(
                    combinators.value,
                    Decimal.mul(multiBuyables[5].amount.value, attractionEff.value).plus(1).log10()
                ),
                1
            )
                .log10()
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
        })),
        createMultiBuyable(() => ({
            visibility: () => showIf(Decimal.gte(best.value, 4)),
            costSets: [
                {
                    cost: 1e12,
                    resource: flame.flame
                },
                {
                    cost: 1e6,
                    resource: earth.earth
                }
            ],
            display: () => ({
                title: "Magma Molecule",
                description:
                    'Boost the effect of the "Heat = Speed" upgrade based on Base Particle gain.',
                effectDisplay: "^" + format(multiBuyableEffects[4].value)
            }),
            purchaseLimit: moleculeLimit
        })),
        createMultiBuyable(() => ({
            visibility: () => showIf(Decimal.gte(best.value, 5)),
            costSets: [
                {
                    cost: 5e14,
                    resource: life.life
                },
                {
                    cost: 2e7,
                    resource: earth.earth
                }
            ],
            display: () => ({
                title: "Wood Molecule",
                description: "Divide the Earth Grid Cost based on Combinators.",
                effectDisplay: "/" + format(multiBuyableEffects[5].value)
            }),
            purchaseLimit: moleculeLimit
        }))
    ];

    globalBus.on("update", diff => {
        covalencePower.value = Decimal.add(
            covalencePower.value,
            Decimal.mul(Decimal.add(ionicPower.value, ionicBondEff.value), diff)
        );
        attractionPower.value = Decimal.add(
            attractionPower.value,
            Decimal.mul(Decimal.add(covalencePower.value, covalentBondEff.value), diff)
        );
    });

    const attractionPower = createResource<DecimalSource>(1, "Attraction Power");
    const attractionEff = computed(() => {
        return Decimal.max(attractionPower.value, 1).log10().div(3).plus(1);
    });

    const covalencePower = createResource<DecimalSource>(0);
    const covalentBonds: Buyable<BuyableOptions> = createBuyable(() => ({
        cost: () => Decimal.pow(8, Decimal.pow(covalentBonds.amount.value, 2)),
        resource: attractionPower,
        display: () => ({
            title: "Covalent Bonds",
            description: "Creates " + format(covalentBondEff.value) + " additional Covalence Power."
        })
    }));
    const covalentBondEff = computed(() => {
        return Decimal.pow(2, Decimal.mul(covalentBonds.amount.value, covalenceBoostEff.value)).sub(
            1
        );
    });

    const covalenceBoost: Buyable<BuyableOptions> = createBuyable(() => ({
        cost: () => Decimal.pow(5, Decimal.pow(covalenceBoost.amount.value, 3)).times(1e5),
        resource: attractionPower,
        display: () => ({
            title: "Covalence Boosts",
            description:
                "Makes Covalent Bonds " +
                format(Decimal.sub(covalenceBoostEff.value, 1).times(100)) +
                "% stronger."
        })
    }));
    const covalenceBoostEff = computed(() => {
        return Decimal.div(covalenceBoost.amount.value, 2).plus(1);
    });

    const ionicPower = createResource<DecimalSource>(0);
    const ionicBonds: Buyable<BuyableOptions> = createBuyable(() => ({
        cost: () => Decimal.pow(400, Decimal.pow(ionicBonds.amount.value, 2)).times(100),
        resource: attractionPower,
        display: () => ({
            title: "Ionic Bonds",
            description: "Creates " + format(ionicBondEff.value) + " additional Ionic Power."
        })
    }));
    const ionicBondEff = computed(() => {
        return Decimal.pow(2, Decimal.mul(ionicBonds.amount.value, ionicBoostEff.value))
            .sub(1)
            .div(10);
    });

    const ionicBoost: Buyable<BuyableOptions> = createBuyable(() => ({
        cost: () => Decimal.pow(15, Decimal.pow(ionicBoost.amount.value, 3)).times(3e5),
        resource: attractionPower,
        display: () => ({
            title: "Ionic Boosts",
            description:
                "Makes Ionic Bonds " +
                format(Decimal.sub(ionicBoostEff.value, 1).times(100)) +
                "% stronger."
        })
    }));
    const ionicBoostEff = computed(() => {
        return Decimal.div(ionicBoost.amount.value, 2).plus(1);
    });

    const moleculeTab = createTab(() => ({
        display: jsx(() => <>{multiBuyables.map(render)}</>)
    }));

    const intrabondTab = createTab(() => ({
        display: jsx(() => (
            <>
                <br />
                There is <b style="font-size: 20px;">{format(attractionPower.value)}</b> Attraction
                Power, which multiplies effective Molecules by{" "}
                <b style="font-size: 20px;">{format(attractionEff.value)}</b>.<br />
                <br />
                There is <b>
                    {format(Decimal.add(covalencePower.value, covalentBondEff.value))}
                </b>{" "}
                Covalence Power. {render(covalentBonds)} {render(covalenceBoost)}
                <br />
                <br />
                There is <b>{format(Decimal.add(ionicPower.value, ionicBondEff.value))}</b> Ionic
                Power. {render(ionicBonds)} {render(ionicBoost)}
                <br />
                <br />
            </>
        ))
    }));

    const tabFamily: TabFamily<TabFamilyOptions> = createTabFamily({
        Molecules: () => ({
            visibility: Visibility.Visible,
            tab: moleculeTab,
            display: "Molecules",
            glowColor: () =>
                multiBuyables.some(
                    bbl => bbl.canPurchase.value && Decimal.lt(bbl.amount.value, 1)
                ) || Decimal.gt(conversion.currentGain.value, combinators.value)
                    ? "red"
                    : ""
        }),

        Intrabonds: () => ({
            visibility: () => showIf(advancements.milestones[23].earned.value),
            tab: intrabondTab,
            display: "Intrabonds",
            style: () => ({
                borderColor: advancements.milestones[23].earned.value ? "#ff9100" : "transparent"
            })
        })
    });

    return {
        id,
        name,
        color,
        combinators,
        best,
        multiBuyables,
        multiBuyableEffects,
        mainEff,
        attractionPower,
        covalencePower,
        covalentBonds,
        covalenceBoost,
        ionicPower,
        ionicBonds,
        ionicBoost,
        tabFamily,
        display: jsx(() => (
            <>
                <MainDisplay resource={combinators} color={color} />
                {render(resetButton)} <br />
                <br />
                Multiplies {advancements.milestones[31].earned.value ? "Flame, Life, Aqua, " : ""}
                Earth, Lightning, Air, and Cryo Particles by {format(mainEff.value)}.
                <br />
                <br />
                {render(tabFamily)}
            </>
        )),
        treeNode
    };
});

export default layer;
