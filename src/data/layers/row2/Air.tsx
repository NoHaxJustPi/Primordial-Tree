/**
 * @module
 * @hidden
 */
import { main } from "data/projEntry";
import { Conversion, createCumulativeConversion, ScalingFunction } from "features/conversion";
import { jsx, Visibility } from "features/feature";
import { createReset } from "features/reset";
import MainDisplay from "features/resources/MainDisplay.vue";
import { createResource, Resource } from "features/resources/resource";
import { addTooltip, TooltipDirection } from "features/tooltips/tooltip";
import { createResourceTooltip } from "features/trees/tree";
import { globalBus } from "game/events";
import { createLayer } from "game/layers";
import {
    createSequentialModifier,
    createMultiplicativeModifier,
    Modifier,
    createModifierSection
} from "game/modifiers";
import Decimal, { DecimalSource, format } from "util/bignum";
import { render } from "util/vue";
import { computed, unref } from "vue";
import { createLayerTreeNode, createResetButton } from "../../common";
import advancements from "../Advancements";
import life from "../row1/Life";
import combinators from "../row3/Combinators";

const layer = createLayer("ai", () => {
    const id = "ai";
    const name = "Air";
    const color = "#ffd1fb";

    const air = createResource<DecimalSource>(0, "Air Particles");

    const wind = createResource<DecimalSource>(0, "Wind Force");
    const windMul = computed(() => {
        return Decimal.gte(air.value, 1) ? air.value : 0;
    });
    const windEff = computed(() => {
        let eff = Decimal.add(wind.value, 1);
        if (eff.gte(10)) eff = Decimal.pow(10, eff.log10().sqrt());
        return eff;
    });

    const zephyr = createResource<DecimalSource>(0, "Zephyr Force");
    const zephyrMul = computed(() => {
        return Decimal.gte(air.value, 3) ? Decimal.div(wind.value, 10) : 0;
    });
    const zephyrEff = computed(() => {
        return Decimal.add(zephyr.value, 1).log2();
    });

    const tornado = createResource<DecimalSource>(0, "Tornado Force");
    const tornadoMul = computed(() => {
        return Decimal.gte(air.value, 5) ? Decimal.div(zephyr.value, 10) : 0;
    });
    const tornadoEff = computed(() => {
        return Decimal.add(tornado.value, 1).log10().plus(1).log(3).plus(1).sqrt();
    });

    globalBus.on("update", diff => {
        if (advancements.milestones[14].earned.value) {
            wind.value = Decimal.mul(Decimal.pow(10, Decimal.sqrt(windMul.value)), diff)
                .plus(Decimal.pow(10, wind.value))
                .log10();
            zephyr.value = Decimal.mul(Decimal.pow(10, Decimal.sqrt(zephyrMul.value)), diff)
                .plus(Decimal.pow(10, zephyr.value))
                .log10();
            tornado.value = Decimal.mul(Decimal.pow(10, Decimal.sqrt(tornadoMul.value)), diff)
                .plus(Decimal.pow(10, tornado.value))
                .log10();
        } else {
            wind.value = Decimal.mul(windMul.value, diff).plus(Decimal.pow(10, wind.value)).log10();
            zephyr.value = Decimal.mul(zephyrMul.value, diff)
                .plus(Decimal.pow(10, zephyr.value))
                .log10();
            tornado.value = Decimal.mul(tornadoMul.value, diff)
                .plus(Decimal.pow(10, tornado.value))
                .log10();
        }
    });

    const conversion: Conversion<{
        scaling: ScalingFunction;
        baseResource: Resource<DecimalSource>;
        gainResource: Resource<DecimalSource>;
        buyMax: () => boolean;
        roundUpCost: true;
        gainModifier: Required<Modifier>;
    }> = createCumulativeConversion(() => ({
        scaling: {
            currentGain: conv => {
                if (Decimal.lt(conv.baseResource.value, 1e4)) return 0;

                if (advancements.milestones[10].earned.value)
                    return Decimal.div(conv.baseResource.value, 1e4)
                        .pow(1 / 4)
                        .times(3)
                        .sub(2)
                        .floor();
                else
                    return Decimal.div(conv.baseResource.value, 5e3)
                        .log2()
                        .root(1.4)
                        .floor()
                        .sub(conv.gainResource.value);
            },
            currentAt: conv => {
                if (advancements.milestones[10].earned.value)
                    return Decimal.div(unref(conv.currentGain), 3)
                        .plus(2 / 3)
                        .pow(4)
                        .times(1e4);
                else
                    return Decimal.pow(2, Decimal.add(conv.gainResource.value, 1).pow(1.4)).times(
                        5e3
                    );
            },
            nextAt: conv => {
                if (advancements.milestones[10].earned.value)
                    return Decimal.div(unref(conv.currentGain), 3).plus(1).pow(4).times(1e4);
                else
                    return Decimal.pow(2, Decimal.add(conv.gainResource.value, 1).pow(1.4)).times(
                        5e3
                    );
            }
        } as ScalingFunction,
        baseResource: life.life,
        gainResource: air,
        buyMax: () => advancements.milestones[10].earned.value,
        roundUpCost: true,
        gainModifier: createSequentialModifier(
            createMultiplicativeModifier(
                combinators.mainEff,
                "Particle Combinator Effect",
                advancements.milestones[15].earned
            )
        )
    }));

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => [layer]
    }));

    const treeNode = createLayerTreeNode(() => ({
        visibility: () =>
            advancements.milestones[6].earned.value ? Visibility.Visible : Visibility.Hidden,
        layerID: id,
        display: jsx(() => <img src="./nodes/air.png" />),
        color,
        reset
    }));
    addTooltip(treeNode, {
        display: createResourceTooltip(air),
        pinnable: true,
        style: () => (treeNode.visibility.value === Visibility.Visible ? "" : "display: none")
    });

    const resetButton = createResetButton(() => ({
        conversion,
        tree: main.tree,
        treeNode
    }));
    /*addTooltip(resetButton, {
        display: jsx(() => createModifierSection("Modifiers", "", conversion.gainModifier, conversion.scaling.currentGain(conversion))),
        pinnable: true,
        direction: TooltipDirection.DOWN,
        style: "width: 400px; text-align: left"
    });*/ // button can't be clicked when tooltip is added

    return {
        id,
        name,
        color,
        air,
        wind,
        windEff,
        zephyr,
        zephyrEff,
        tornado,
        tornadoEff,
        display: jsx(() => {
            const windEl = Decimal.gt(windMul.value, 0) ? (
                <span>
                    Wind: {format(wind.value, 2)}, Wind Speed: {format(windMul.value, 2)}x<br />
                    Multiplies Life Particle gain by {format(windEff.value, 2)}.<br />
                    <br />
                </span>
            ) : (
                ""
            );

            const zephyrEl = Decimal.gt(zephyrMul.value, 0) ? (
                <span>
                    Zephyr: {format(zephyr.value, 2)}, Zephyr Speed: {format(zephyrMul.value, 2)}x
                    <br />
                    Adds {format(zephyrEff.value, 2)} levels to all Life Buyables.
                    <br />
                    <br />
                </span>
            ) : (
                ""
            );

            const tornadoEl = Decimal.gt(tornadoMul.value, 0) ? (
                <span>
                    Tornado: {format(tornado.value, 2)}, Tornado Speed:{" "}
                    {format(tornadoMul.value, 2)}x<br />
                    Raise Base Particle gain ^{format(tornadoEff.value, 2)}
                    <br />
                    <br />
                </span>
            ) : (
                ""
            );

            return (
                <>
                    <MainDisplay resource={air} color={color} />
                    {render(resetButton)}
                    <br />
                    <br />
                    {windEl}
                    <br />
                    {zephyrEl}
                    <br />
                    {tornadoEl}
                    <br />
                </>
            );
        }),
        treeNode
    };
});

export default layer;
