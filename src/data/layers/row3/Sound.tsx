/**
 * @module
 * @hidden
 */

import {
    createLayerTreeNode,
    createResetButton,
    ResetButton,
    ResetButtonOptions
} from "data/common";
import { main } from "data/projEntry";
import {
    Conversion,
    ConversionOptions,
    createConversion,
    createPolynomialScaling
} from "features/conversion";
import { Visibility, jsx } from "features/feature";
import { createReset } from "features/reset";
import { createResource, trackBest } from "features/resources/resource";
import { addTooltip } from "features/tooltips/tooltip";
import { createResourceTooltip } from "features/trees/tree";
import { createLayer } from "game/layers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import MainDisplay from "features/resources/MainDisplay.vue";
import air from "../row2/Air";
import advancements from "../side/Advancements";
import { render } from "util/vue";
import light from "./Light";
import { globalBus } from "game/events";
import { createUpgrade, Upgrade, UpgradeOptions } from "features/upgrades/upgrade";
import { computed } from "vue";
import { format } from "util/break_eternity";

const layer = createLayer("sound", () => {
    const id = "sound";
    const name = "Sound";
    const color = "#ddcfff";

    const sound = createResource<DecimalSource>(0, "Sound Particles");
    const best = trackBest(sound);

    const conversion: Conversion<ConversionOptions> = createConversion(() => ({
        scaling: createPolynomialScaling(() => 1e7, 1 / 3),
        baseResource: air.air,
        gainResource: sound
    }));

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => [layer]
    }));

    const treeNode = createLayerTreeNode(() => ({
        visibility: () =>
            advancements.milestones[32].earned.value ? Visibility.Visible : Visibility.Hidden,
        layerID: id,
        display: jsx(() => <img src="./nodes/sound.png" />),
        color,
        reset
    }));
    addTooltip(treeNode, {
        display: createResourceTooltip(sound),
        pinnable: true,
        style: () => (treeNode.visibility.value === Visibility.Visible ? "" : "display: none")
    });

    const resetButton: ResetButton<ResetButtonOptions> = createResetButton(() => ({
        conversion,
        tree: main.tree,
        treeNode
    }));

    const ultrasound = createResource<DecimalSource>(0, "Ultrasound");

    const ultrasoundGainMult = computed(() => {
        let mult = Decimal.dOne;

        if (Decimal.gte(light.lights[3].buyables[1].amount.value, 1))
            mult = mult.times(light.lightBuyableEffects[3][1].value);

        if (upgrades[3].bought.value) mult = mult.times(upgradeEffects[3].value);
        if (advancements.milestones[37].earned.value) mult = mult.times(2);

        return mult;
    });

    const upgradeEffects = [
        computed(() => Decimal.add(ultrasound.value, 1).log10().plus(1).log10().plus(1)),
        computed(() => Decimal.add(ultrasound.value, 1).log10().plus(1).sqrt()),
        computed(() => {
            let ret = Decimal.add(ultrasound.value, 1).log10().div(20);
            if (ret.gte(0.5)) ret = ret.plus(0.5).log10().plus(0.5);
            return ret;
        }),
        computed(() => Decimal.add(ultrasound.value, 1).log10().plus(1).sqrt()),
        computed(() => Decimal.add(ultrasound.value, 1).log10().plus(1)),
        computed(() => Decimal.div(ultrasound.value, 100).plus(1))
    ];

    const upgrades: Upgrade<UpgradeOptions>[] = [
        createUpgrade(() => ({
            display: () => ({
                title: "Pitch",
                description:
                    "Ultrasound boosts the gain speed of all Light Energy colors at a very reduced rate.",
                effectDisplay: format(upgradeEffects[0].value) + "x"
            }),
            cost: 100,
            resource: ultrasound
        })),
        createUpgrade(() => ({
            display: () => ({
                title: "Duration",
                description: "Ultrasound boosts Wind/Zephyr/Tornado speeds at a reduced rate.",
                effectDisplay: format(upgradeEffects[1].value) + "x"
            }),
            cost: 1e3,
            resource: ultrasound
        })),
        createUpgrade(() => ({
            display: () => ({
                title: "Volume",
                description: "Ultrasound boosts Life Buyable Power at a reduced rate.",
                effectDisplay: "+" + format(Decimal.mul(upgradeEffects[2].value, 100)) + "%"
            }),
            cost: 2.5e3,
            resource: ultrasound
        })),
        createUpgrade(() => ({
            display: () => ({
                title: "Timbre",
                description: "Ultrasound boosts its own gain at a reduced rate.",
                effectDisplay: format(upgradeEffects[3].value) + "x"
            }),
            cost: 1e4,
            resource: ultrasound
        })),
        createUpgrade(() => ({
            display: () => ({
                title: "Texture",
                description: "Ultrasound boosts Flame Particle gain at a reduced rate.",
                effectDisplay: format(upgradeEffects[4].value) + "x"
            }),
            cost: 1e5,
            resource: ultrasound
        })),
        createUpgrade(() => ({
            display: () => ({
                title: "Location",
                description: "Ultrasound boosts Aqua bar speed.",
                effectDisplay: format(upgradeEffects[5].value) + "x"
            }),
            cost: 4e5,
            resource: ultrasound
        }))
    ];

    globalBus.on("update", diff => {
        const spd = player.devSpeed ?? 1
        ultrasound.value = Decimal.mul(sound.value, 1e4).times(ultrasoundGainMult.value);
    });

    return {
        id,
        name,
        color,
        sound,
        best,
        ultrasound,
        upgrades,
        upgradeEffects,
        display: jsx(() => (
            <>
                <MainDisplay resource={sound} color={color} />
                {render(resetButton)}
                <br />
                There is {format(ultrasound.value)} Ultrasound (generated by Sound Particles)
                <br />
                <br />
                {upgrades.map(render)}
            </>
        )),
        treeNode
    };
});

export default layer;
