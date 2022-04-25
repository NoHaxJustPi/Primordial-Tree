/**
 * @module
 * @hidden
 */
import { createCumulativeConversion, createPolynomialScaling } from "features/conversion";
import { CoercableComponent, jsx, Visibility } from "features/feature";
import { createReset, Reset } from "features/reset";
import MainDisplay from "features/resources/MainDisplay.vue";
import { createResource, Resource, trackBest } from "features/resources/resource";
import { createLayer } from "game/layers";
import Decimal, { DecimalSource, format, formatWhole } from "util/bignum";
import { render } from "util/vue";
import { createLayerTreeNode, createResetButton } from "../common";
import advancements from "./Advancements";
import { main } from "data/projEntry";
import { Challenge, createChallenge } from "features/challenges/challenge";
import { Computable } from "util/computed";
import { computed, unref } from "vue";
import flame from "./Flame";
import life from "./Life";
import aqua from "./Aqua";
import { addTooltip } from "features/tooltips/tooltip";
import { createResourceTooltip } from "features/trees/tree";

const layer = createLayer("c", () => {
    const id = "c";
    const name = "Cryo";
    const color = "#03f4fc";

    const cryo = createResource<DecimalSource>(0, "Cryo Particles");
    const best = trackBest(cryo);

    const conversion = createCumulativeConversion(() => ({
        scaling: createPolynomialScaling(1e3, 3 / 4),
        baseResource: aqua.aqua,
        gainResource: cryo,
        roundUpCost: true
    }));

    const challenge1Data = {
        lifeBuyableCosts: computed(() =>
            Decimal.div(challenges[0].completions.value, 4).plus(1.25)
        ),
        aquaParticleCost: computed(() => Decimal.div(challenges[0].completions.value, 5).plus(1.2)),
        reward: computed(() => {
            let reward = Decimal.add(cryo.value, 1)
                .sqrt()
                .times(challenges[0].completions.value)
                .times(Decimal.pow(1.1, challenges[0].completions.value))
                .plus(1);

            const scs = Decimal.add(20, challenges[0].completions.value);
            if (reward.gte(scs)) reward = reward.log(scs.sqrt()).pow(2).times(scs).div(4);

            return reward;
        })
    };

    const challenge2Data = {
        aquaBarDiv: computed(() => Decimal.pow(1.5, challenges[1].completions.value).times(10)),
        reward: computed(() =>
            Decimal.mul(cryo.value, challenges[1].completions.value).plus(1).log10().plus(1)
        )
    };

    const challenge3Data = {
        exp: computed(() => Decimal.div(challenges[2].completions.value, 2).plus(2)),
        reward: computed(() => Decimal.sqrt(challenges[2].completions.value).div(10).plus(1))
    };

    const challenges: Challenge<{
        visibility: () => Visibility.Visible | Visibility.None;
        reset: Reset<{ thingsToReset: () => Record<string, unknown>[] }>;
        completionLimit: number;
        resource: Resource<DecimalSource>;
        goal: Computable<Decimal>;
        display: Computable<
            | CoercableComponent
            | {
                  title: CoercableComponent;
                  description: CoercableComponent;
                  goal: CoercableComponent;
                  reward: CoercableComponent;
                  effectDisplay?: CoercableComponent;
              }
        >;
    }>[] = [
        createChallenge(() => ({
            visibility: () => (Decimal.gte(best.value, 1) ? Visibility.Visible : Visibility.None),
            reset: challengeReset,
            completionLimit: 10,
            resource: aqua.aqua,
            goal: () => {
                const comps: DecimalSource = challenges[0].completions.value;
                return Decimal.pow(2, comps).times(100);
            },
            display: () => ({
                title:
                    "Temperature Decrease (" +
                    formatWhole(challenges[0].completions.value) +
                    "/" +
                    formatWhole(challenges[0].completionLimit) +
                    ")",
                description:
                    "Disable the Flame layer" +
                    ", Life buyable costs are raised ^" +
                    format(challenge1Data.lifeBuyableCosts.value, 2) +
                    ", and Aqua Particle base cost is raised ^" +
                    format(challenge1Data.aquaParticleCost.value, 2),
                goal: formatWhole(unref(challenges[0].goal)) + " Aqua Particles",
                reward: "All Aqua bars are faster based on Cryo Particles.",
                effectDisplay: format(challenge1Data.reward.value, 2) + "x"
            })
        })),
        createChallenge(() => ({
            visibility: () =>
                Decimal.gte(challenges[0].completions.value, 1)
                    ? Visibility.Visible
                    : Visibility.None,
            reset: challengeReset,
            completionLimit: 10,
            resource: aqua.aqua,
            goal: () => {
                const comps: DecimalSource = challenges[1].completions.value;
                return Decimal.pow(2.5, comps).times(150);
            },
            display: () => ({
                title:
                    "Full Freeze (" +
                    formatWhole(challenges[1].completions.value) +
                    "/" +
                    formatWhole(challenges[1].completionLimit) +
                    ")",
                description:
                    "Disable the Life layer" +
                    ", and Aqua bars are " +
                    format(challenge2Data.aquaBarDiv.value, 2) +
                    "x slower",
                goal: formatWhole(unref(challenges[1].goal)) + " Aqua Particles",
                reward: "All Life Buyables are cheaper based on Cryo Particles.",
                effectDisplay: "/" + format(challenge2Data.reward.value, 2)
            })
        })),
        createChallenge(() => ({
            visibility: () =>
                Decimal.gte(challenges[1].completions.value, 1)
                    ? Visibility.Visible
                    : Visibility.None,
            reset: challengeReset,
            completionLimit: 10,
            resource: main.particles,
            goal: () => {
                const comps: DecimalSource = challenges[2].completions.value;
                return Decimal.pow(10, Decimal.pow(comps, 1.5)).times(1e4);
            },
            display: () => ({
                title:
                    "Absolute Zero (" +
                    formatWhole(challenges[2].completions.value) +
                    "/" +
                    formatWhole(challenges[2].completionLimit) +
                    ")",
                description:
                    "Disable the Aqua layer" +
                    ", and Fire Upgrade and Life Buyable costs are raised ^" +
                    format(challenge3Data.exp.value, 2),
                goal: formatWhole(unref(challenges[2].goal)) + " Particles",
                reward: "Empower the first Flame upgrade.",
                effectDisplay: "^" + format(challenge3Data.reward.value, 2)
            })
        }))
    ];

    const challengeReset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => [flame, life, aqua],
        onReset() {
            main.particles.value = 10;
            main.best.value = main.particles.value;
            main.total.value = main.particles.value;
        }
    }));

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => [layer]
    }));

    const treeNode = createLayerTreeNode(() => ({
        visibility: () =>
            advancements.milestones[2].earned.value ? Visibility.Visible : Visibility.Hidden,
        layerID: id,
        display: jsx(() => <img src="./nodes/cryo.png" />),
        color,
        reset,
        glowColor: () => (challenges.some(c => c.canComplete.value) ? "red" : "")
    }));
    addTooltip(treeNode, {
        display: createResourceTooltip(cryo),
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
        cryo,
        best,
        display: jsx(() => (
            <>
                <MainDisplay resource={cryo} color={color} />
                {render(resetButton)}
                <br />
                <br />
                <table>
                    <tbody>
                        {challenges.map(ch => (
                            <tr>
                                <td>{render(ch)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </>
        )),
        treeNode,
        challenges,
        challenge1Data,
        challenge2Data,
        challenge3Data
    };
});

export default layer;
