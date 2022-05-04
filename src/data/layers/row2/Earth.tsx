/**
 * @module
 * @hidden
 */
import { createLayerTreeNode, createResetButton } from "data/common";
import { createClickable } from "features/clickables/clickable";
import { createCumulativeConversion, createPolynomialScaling } from "features/conversion";
import { jsx, Visibility } from "features/feature";
import { createGrid } from "features/grids/grid";
import { createReset } from "features/reset";
import MainDisplay from "features/resources/MainDisplay.vue";
import { createResource, trackBest } from "features/resources/resource";
import { addTooltip } from "features/tooltips/tooltip";
import { Direction } from "util/common";
import { createResourceTooltip } from "features/trees/tree";
import { createLayer } from "game/layers";
import {
    createSequentialModifier,
    createMultiplicativeModifier,
    createModifierSection
} from "game/modifiers";
import Decimal, { DecimalSource } from "lib/break_eternity";
import { format, formatWhole } from "util/break_eternity";
import { render } from "util/vue";
import { computed } from "vue";
import { main } from "../../projEntry";
import advancements from "../Advancements";
import flame from "../row1/Flame";
import combinators from "../row3/Combinators";

const layer = createLayer("e", () => {
    const id = "e";
    const name = "Earth";
    const color = "#733000";

    const earth = createResource<DecimalSource>(0, "Earth Particles");
    const best = trackBest(earth);

    const gridLevel = createResource<DecimalSource>(0);
    const bestGridLevel = trackBest(gridLevel);
    const gridCost = computed(() => {
        return Decimal.pow(2, gridLevel.value);
    });

    const gridCellMult = computed(() => {
        return Decimal.pow(2, gridLevel.value);
    });
    const gridMultExp = computed(() => {
        return Decimal.div(0.2, Decimal.mul(gridLevel.value, -1).sub(1)).plus(0.4);
    });

    const flameMult = computed(() => {
        const rowFactors: { [key: number]: DecimalSource } = {};
        const colFactors: { [key: number]: DecimalSource } = {};

        for (let r = 1; r <= grid.rows; r++) {
            for (let c = 1; c <= grid.cols; c++) {
                if (grid.cells[r * 100 + c].state) {
                    rowFactors[r] = Decimal.add(rowFactors[r] || 1, gridCellMult.value);

                    colFactors[c] = Decimal.add(colFactors[c] || 1, gridCellMult.value);
                }
            }
        }

        const rowValues = Object.values(rowFactors);
        const colValues = Object.values(colFactors);

        const rowMult = rowValues.length == 0 ? 1 : rowValues.reduce((a, c) => Decimal.mul(a, c));
        const colMult = colValues.length == 0 ? 1 : colValues.reduce((a, c) => Decimal.mul(a, c));

        let mult = Decimal.mul(rowMult, colMult).pow(gridMultExp.value);
        if (mult.gte(10)) mult = Decimal.pow(10, mult.log10().sqrt());
        if (mult.gte(100)) mult = Decimal.pow(100, mult.log(100).cbrt());

        return mult;
    });

    const baseGainAdded = computed(() => {
        if (Decimal.lt(gridLevel.value, 1)) return 0;
        else return flameMult.value.div(10).plus(0.9).log10().times(10);
    });

    const torrentEffAdded = computed(() => {
        if (Decimal.lt(gridLevel.value, 2)) return 0;
        else
            return Decimal.sub(
                0.8,
                Decimal.div(0.8, Decimal.div(baseGainAdded.value, 100).plus(1))
            );
    });

    const lb6Mult = computed(() => {
        if (Decimal.lt(gridLevel.value, 4)) return 1;
        else return Decimal.add(baseGainAdded.value, 1).log10().div(2).plus(1).pow(2);
    });

    const conversion = createCumulativeConversion(() => ({
        scaling: createPolynomialScaling(1.5e5, 1 / 2),
        baseResource: flame.flame,
        gainResource: earth,
        roundUpCost: true,
        gainModifier: createSequentialModifier(
            createMultiplicativeModifier(
                combinators.mainEff,
                "Particle Combinator Effect",
                advancements.milestones[15].earned
            )
        )
    }));

    const levelDown = createClickable(() => ({
        canClick: () => Decimal.gte(gridLevel.value, 1),
        onClick: () => {
            gridLevel.value = Decimal.sub(gridLevel.value, 1);
            for (let r = 1; r <= grid.rows; r++) {
                for (let c = 1; c <= grid.cols; c++) {
                    grid.setState(r * 100 + c, true);
                }
            }
        },
        display: () => ({
            title: "Level Down",
            description: " "
        }),
        small: true
    }));

    const levelUp = createClickable(() => ({
        canClick: () => Object.values(grid.cells).every(cell => cell.state),
        onClick: () => {
            if (Decimal.gte(gridLevel.value, Decimal.sub(bestGridLevel.value, 1))) {
                for (let r = 1; r <= grid.rows; r++) {
                    for (let c = 1; c <= grid.cols; c++) {
                        grid.setState(r * 100 + c, false);
                    }
                }
            }
            gridLevel.value = Decimal.add(gridLevel.value, 1);
        },
        display: () => ({
            title: "Level Up",
            description: "Levels up the Earth Grid, but resets it. Requires all grid cells filled."
        })
    }));

    const grid = createGrid(() => ({
        rows: 5,
        cols: 5,
        getStartState: () => false,
        getDisplay: () => " ",
        getStyle: (_, state) => ({
            width: "40px",
            minHeight: "40px",
            height: "40px",
            margin: "0 auto",
            backgroundColor: !state ? "black" : "green"
        }),
        getCanClick: (_, state) => {
            return !state && Decimal.gte(earth.value, gridCost.value);
        },
        onClick: id => {
            earth.value = Decimal.sub(earth.value, gridCost.value);
            grid.setState(id, true);
        }
    }));

    const reset = createReset(() => ({
        thingsToReset: (): Record<string, unknown>[] => [layer]
    }));

    const treeNode = createLayerTreeNode(() => ({
        visibility: () =>
            advancements.milestones[11].earned.value ? Visibility.Visible : Visibility.Hidden,
        layerID: id,
        display: jsx(() => <img src="./nodes/earth.png" />),
        color,
        reset
    }));
    addTooltip(treeNode, {
        display: createResourceTooltip(earth),
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
        earth,
        best,
        gridLevel,
        bestGridLevel,
        display: jsx(() => {
            return (
                <>
                    <MainDisplay resource={earth} color={color} />
                    {render(resetButton)}
                    <br />
                    <br />
                    {Decimal.gte(best.value, 1) ? (
                        <div>
                            Grid Level: {formatWhole(gridLevel.value)}
                            <br />
                            Grid Cost: {formatWhole(gridCost.value)} Earth Particles
                            <br />
                            <br />
                            Flame Particle Multiplier: {format(flameMult.value)}x<br />
                            <span v-show={Decimal.gte(gridLevel.value, 1)}>
                                Base Particle Gain Added: +{format(baseGainAdded.value)}/s
                                <br />
                            </span>
                            <span v-show={Decimal.gte(gridLevel.value, 2)}>
                                Torrent Effect Added: +
                                {format(Decimal.mul(torrentEffAdded.value, 100))}%<br />
                            </span>
                            <span v-show={Decimal.gte(gridLevel.value, 4)}>
                                Life Buyable 6 Effect Mult: {format(lb6Mult.value, 2)}x<br />
                            </span>
                            <br />
                            {render(grid)}
                            <br />
                            <table>
                                <tr>
                                    <td>{render(levelDown)}</td>
                                </tr>
                                <tr>
                                    <td>{render(levelUp)}</td>
                                </tr>
                            </table>
                        </div>
                    ) : (
                        <div></div>
                    )}
                </>
            );
        }),
        treeNode,
        grid,
        flameMult,
        baseGainAdded,
        torrentEffAdded,
        lb6Mult
    };
});

export default layer;
