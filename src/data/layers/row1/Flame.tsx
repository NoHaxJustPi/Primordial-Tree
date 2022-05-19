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
import { CoercableComponent, jsx, Visibility } from "features/feature";
import { createReset } from "features/reset";
import MainDisplay from "features/resources/MainDisplay.vue";
import { createResource, displayResource, Resource, trackBest } from "features/resources/resource";
import { createLayer } from "game/layers";
import Decimal, { DecimalSource } from "util/bignum";
import { render } from "util/vue";
import { createLayerTreeNode, createResetButton } from "../../common";
import { createUpgrade, Upgrade } from "features/upgrades/upgrade";
import { Computable } from "util/computed";
import { format, formatWhole } from "util/break_eternity";
import { computed, unref } from "vue";
import life from "./Life";
import advancements from "../side/Advancements";
import lightning from "../row2/Lightning";
import cryo from "../row2/Cryo";
import earth from "../row2/Earth";
import combinators from "../row4/Combinators";
import sound from "../row3/Sound";
import { globalBus } from "game/events";
import { createResourceTooltip } from "features/trees/tree";
import { addTooltip } from "features/tooltips/tooltip";
import { Direction } from "util/common";
import {
    createSequentialModifier,
    createMultiplicativeModifier,
    Modifier,
    createModifierSection
} from "game/modifiers";

const layer = createLayer("f", () => {
    const id = "f";
    const name = "Flame";
    const color = "#fc3b00";

    const flame = createResource<DecimalSource>(0, "Flame Particles");
    const best = trackBest(flame);

    const time = createResource<number>(0);
    const autoDone = createResource<boolean>(false);

    const baseReq = computed(() => (cryo.challenges[0].active.value ? Decimal.dInf : 10));

    const conversion: Conversion<ConversionOptions & { gainModifier: Required<Modifier> }> =
        createCumulativeConversion(() => ({
            scaling: createPolynomialScaling(baseReq, 1 / 3),
            baseResource: main.particles,
            gainResource: flame,
            roundUpCost: true,
            gainModifier: createSequentialModifier(
                createMultiplicativeModifier(
                    upgradeEffects[4],
                    "Flame Upgrade 5",
                    upgradesR2[1].bought
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
                    earth.flameMult,
                    "Earth Grid Boost 1",
                    advancements.milestones[11].earned
                ),
                createMultiplicativeModifier(
                    combinators.mainEff,
                    "Particle Combinator Effect",
                    advancements.milestones[31].earned
                ),
                createMultiplicativeModifier(
                    sound.upgradeEffects[4],
                    "Sound Upgrade 5",
                    sound.upgrades[4].bought
                )
            )
        }));

    globalBus.on("update", diff => {
        const spd = player.devSpeed ?? 1

        if (advancements.milestones[3].earned.value)
            flame.value = Decimal.mul(conversion.currentGain.value, 1e4*spd);
        time.value += diff;

        if (
            !autoDone.value &&
            advancements.milestones[13].earned.value &&
            time.value >= 0.1 &&
            Decimal.gte(flame.value, Decimal.pow(2e4, upgCostExp.value))
        ) {
            autoDone.value = true;
            for (let i = 0; i < 3; i++) {
                upgradesR1[i].purchase();
                upgradesR2[i].purchase();
            }
        }
    });

    const upgradeEffects = {
        0: computed(() => {
            let ret = new Decimal(1);
            ret = ret.plus(life.buyableEffects[2].value);
            return ret.pow(cryo.challenge3Data.reward.value);
        }),
        1: computed(() => {
            let ret = Decimal.add(flame.value, 1).log(20).plus(1);

            if (Decimal.gte(combinators.best.value, 4))
                ret = ret.pow(combinators.multiBuyableEffects[4].value);

            return ret;
        }),
        2: computed(() => {
            return Decimal.add(flame.value, 1)
                .log(5)
                .plus(1)
                .pow(advancements.milestones[29].earned.value ? 2 : 1);
        }),
        3: computed(() => {
            return Decimal.add(flame.value, 1)
                .log10()
                .pow(advancements.milestones[29].earned.value ? 1 : 0.5);
        }),
        4: computed(() => {
            return Decimal.add(main.particles.value, 1)
                .log10()
                .plus(1)
                .log10()
                .plus(1)
                .pow(advancements.milestones[29].earned.value ? 2 : 1);
        }),
        5: computed(() => {
            return Decimal.add(flame.value, 1).log10().sqrt().times(3);
        })
    };

    const upgCostExp = computed(() => {
        let exp = Decimal.dOne;

        if (cryo.challenges[2].active.value) exp = exp.times(cryo.challenge3Data.exp.value);

        return exp;
    });

    const upgradesR1: Array<
        Upgrade<{
            visibility: () => Visibility;
            cost: Computable<DecimalSource>;
            resource: Resource<DecimalSource>;
            display: Computable<CoercableComponent>;
        }>
    > = [
        createUpgrade(() => ({
            visibility: () => (Decimal.gt(best.value, 0) ? Visibility.Visible : Visibility.None),
            cost: 1,
            resource: flame,
            display: jsx(() => (
                <div>
                    <h3>A Hot Start</h3>
                    <br />
                    Generate{" "}
                    {format(
                        upgradeEffects[0].value,
                        Decimal.gt(cryo.challenge3Data.reward.value, 1) ? 2 : 0
                    )}{" "}
                    Particles/second.
                    <br />
                    <br />
                    Cost: {displayResource(flame, unref(upgradesR1[0].cost))} {flame.displayName}
                </div>
            ))
        })),
        createUpgrade(() => ({
            visibility: () => (upgradesR1[0].bought.value ? Visibility.Visible : Visibility.None),
            cost: () => Decimal.pow(5, upgCostExp.value),
            resource: flame,
            display: jsx(() => (
                <div>
                    <h3>Heat = Speed</h3>
                    <br />
                    Flame Particles multiply Particle gain at a reduced rate.
                    <br />
                    Currently: {format(upgradeEffects[1].value, 2)}x<br />
                    <br />
                    Cost: {displayResource(flame, unref(upgradesR1[1].cost))} {flame.displayName}
                </div>
            ))
        })),
        createUpgrade(() => ({
            visibility: () => (upgradesR1[1].bought.value ? Visibility.Visible : Visibility.None),
            cost: () => Decimal.pow(30, upgCostExp.value),
            resource: flame,
            display: jsx(() => (
                <div>
                    <h3>Liquid Fire</h3>
                    <br />
                    Flame Particles make the Bubble bar faster.
                    <br />
                    Currently: {format(upgradeEffects[2].value, 2)}x<br />
                    <br />
                    Cost: {displayResource(flame, unref(upgradesR1[2].cost))} {flame.displayName}
                </div>
            ))
        }))
    ];

    const upgradesR2: Array<
        Upgrade<{
            visibility: () => Visibility;
            cost: Computable<DecimalSource>;
            resource: Resource<DecimalSource>;
            display: Computable<CoercableComponent>;
        }>
    > = [
        createUpgrade(() => ({
            visibility: () =>
                advancements.milestones[1].earned.value ? Visibility.Visible : Visibility.None,
            cost: () => Decimal.pow(100, upgCostExp.value),
            resource: flame,
            display: jsx(() => (
                <div>
                    <h3>Magma Spirit</h3>
                    <br />
                    Flame Particles add levels to the first Life Buyable.
                    <br />
                    Currently: +{formatWhole(upgradeEffects[3].value)}
                    <br />
                    <br />
                    Cost: {displayResource(flame, unref(upgradesR2[0].cost))} {flame.displayName}
                </div>
            ))
        })),
        createUpgrade(() => ({
            visibility: () => (upgradesR2[0].bought.value ? Visibility.Visible : Visibility.None),
            cost: () => Decimal.pow(1e3, upgCostExp.value),
            resource: flame,
            display: jsx(() => (
                <div>
                    <h3>Speed = Heat?</h3>
                    <br />
                    Particles multiply Flame Particle gain at a reduced rate.
                    <br />
                    Currently: {format(upgradeEffects[4].value, 2)}x<br />
                    <br />
                    Cost: {displayResource(flame, unref(upgradesR2[1].cost))} {flame.displayName}
                </div>
            ))
        })),
        createUpgrade(() => ({
            visibility: () => (upgradesR2[1].bought.value ? Visibility.Visible : Visibility.None),
            cost: () => Decimal.pow(1e4, upgCostExp.value),
            resource: flame,
            display: jsx(() => (
                <div>
                    <h3>Hot Feet</h3>
                    <br />
                    Flame Particles increase base Particle gain at a reduced rate.
                    <br />
                    Currently: +{format(upgradeEffects[5].value, 2)}
                    <br />
                    <br />
                    Cost: {displayResource(flame, unref(upgradesR2[2].cost))} {flame.displayName}
                </div>
            ))
        }))
    ];

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => [layer]
    }));

    const treeNode = createLayerTreeNode(() => ({
        layerID: id,
        display: jsx(() => <img src="./nodes/flame.png" />),
        color,
        reset,
        glowColor: () =>
            upgradesR1.some(u => u.canPurchase.value) || upgradesR2.some(u => u.canPurchase.value)
                ? "red"
                : ""
    }));
    addTooltip(treeNode, {
        display: createResourceTooltip(flame),
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
        flame,
        best,
        time,
        autoDone,
        upgradeEffects,
        display: jsx(() => (
            <>
                <MainDisplay resource={flame} color={color} />
                {render(resetButton)}
                <br />
                <br />
                <table>
                    <tbody>
                        <tr>
                            {upgradesR1.map(upg => (
                                <td>{render(upg)}</td>
                            ))}
                        </tr>
                        <tr>
                            {upgradesR2.map(upg => (
                                <td>{render(upg)}</td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </>
        )),
        treeNode,
        upgradesR1,
        upgradesR2
    };
});

export default layer;
