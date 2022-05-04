import ClickableComponent from "features/clickables/Clickable.vue";
import { Resource } from "features/resources/resource";
import { Persistent, PersistentState, persistent } from "game/persistence";
import Decimal, { DecimalSource, format, formatWhole } from "util/bignum";
import {
    Computable,
    GetComputableType,
    GetComputableTypeWithDefault,
    processComputable,
    ProcessedComputable
} from "util/computed";
import { createLazyProxy } from "util/proxies";
import { coerceComponent, isCoercableComponent } from "util/vue";
import { computed, Ref, unref } from "vue";
import {
    CoercableComponent,
    Component,
    OptionsFunc,
    GatherProps,
    getUniqueID,
    jsx,
    Replace,
    setDefault,
    StyleValue,
    Visibility
} from "features/feature";

export const MultiBuyableType = Symbol("MultiBuyable");

export type MultiBuyableDisplay =
    | CoercableComponent
    | {
          title?: CoercableComponent;
          description: CoercableComponent;
          effectDisplay?: CoercableComponent;
      };

export interface MultiBuyableOptions {
    visibility?: Computable<Visibility>;
    costSets: {
        cost: Computable<DecimalSource>;
        resource: Resource;
    }[];
    canPurchase?: Computable<boolean>;
    purchaseLimit?: Computable<DecimalSource>;
    classes?: Computable<Record<string, boolean>>;
    style?: Computable<StyleValue>;
    mark?: Computable<boolean | string>;
    small?: Computable<boolean>;
    display?: Computable<MultiBuyableDisplay>;
    keepRes?: Computable<boolean>;
}

export interface BaseMultiBuyable extends Persistent<DecimalSource> {
    id: string;
    amount: Ref<DecimalSource>;
    maxed: Ref<boolean>;
    canAfford: Ref<boolean>;
    canClick: ProcessedComputable<boolean>;
    onClick: VoidFunction;
    purchase: VoidFunction;
    type: typeof MultiBuyableType;
    [Component]: typeof ClickableComponent;
    [GatherProps]: () => Record<string, unknown>;
}

export type MultiBuyable<T extends MultiBuyableOptions> = Replace<
    T & BaseMultiBuyable,
    {
        visibility: GetComputableTypeWithDefault<T["visibility"], Visibility.Visible>;
        costSets: {
            cost: GetComputableType<T["costSets"][0]["cost"]>;
            resource: GetComputableType<T["costSets"][0]["resource"]>;
        }[];
        canPurchase: GetComputableTypeWithDefault<T["canPurchase"], Ref<boolean>>;
        purchaseLimit: GetComputableTypeWithDefault<T["purchaseLimit"], Decimal>;
        classes: GetComputableType<T["classes"]>;
        style: GetComputableType<T["style"]>;
        mark: GetComputableType<T["mark"]>;
        small: GetComputableType<T["small"]>;
        display: Ref<CoercableComponent>;
    }
>;

export type GenericMultiBuyable = Replace<
    MultiBuyable<MultiBuyableOptions>,
    {
        visibility: ProcessedComputable<Visibility>;
        canPurchase: ProcessedComputable<boolean>;
        purchaseLimit: ProcessedComputable<DecimalSource>;
    }
>;

export function createMultiBuyable<T extends MultiBuyableOptions>(
    optionsFunc: OptionsFunc<T, MultiBuyable<T>, BaseMultiBuyable>
): MultiBuyable<T> {
    return createLazyProxy(persistent => {
        const buyable = Object.assign(persistent, optionsFunc());

        if (buyable.canPurchase == null && buyable.costSets.length == 0) {
            console.warn(
                "Cannot create buyable without a canPurchase property or some element of costSets existing",
                buyable
            );
            throw "Cannot create buyable without a canPurchase property or some element of costSets existing";
        }

        buyable.id = getUniqueID("multibuyable-");
        buyable.type = MultiBuyableType;
        buyable[Component] = ClickableComponent;

        buyable.amount = buyable[PersistentState];
        buyable.canAfford = computed(() => {
            const genericBuyable = buyable as GenericMultiBuyable;

            for (let i = 0; i < genericBuyable.costSets.length; i++) {
                const costSet = genericBuyable.costSets[i];
                const cost = unref(costSet.cost);

                if (Decimal.lt(costSet.resource.value, cost)) return false;
            }

            return true;
        });
        if (buyable.canPurchase == null) {
            buyable.canPurchase = computed(
                () =>
                    unref((buyable as GenericMultiBuyable).visibility) === Visibility.Visible &&
                    unref((buyable as GenericMultiBuyable).canAfford) &&
                    Decimal.lt(
                        (buyable as GenericMultiBuyable).amount.value,
                        unref((buyable as GenericMultiBuyable).purchaseLimit)
                    )
            );
        }
        buyable.maxed = computed(() =>
            Decimal.gte(
                (buyable as GenericMultiBuyable).amount.value,
                unref((buyable as GenericMultiBuyable).purchaseLimit)
            )
        );
        processComputable(buyable as T, "classes");
        const classes = buyable.classes as ProcessedComputable<Record<string, boolean>> | undefined;
        buyable.classes = computed(() => {
            const currClasses = unref(classes) || {};
            if ((buyable as GenericMultiBuyable).maxed.value) {
                currClasses.bought = true;
            }
            return currClasses;
        });
        processComputable(buyable as T, "canPurchase");
        processComputable(buyable as T, "keepRes");

        if (buyable.keepRes === undefined) buyable.keepRes = false;
        const keepRes = buyable.keepRes as ProcessedComputable<boolean>;

        buyable.canClick = buyable.canPurchase as ProcessedComputable<boolean>;
        buyable.onClick = buyable.purchase = function () {
            const genericBuyable = buyable as GenericMultiBuyable;
            if (!unref(genericBuyable.canPurchase) || genericBuyable.costSets.length == 0) {
                return;
            }

            for (let i = 0; i < genericBuyable.costSets.length; i++) {
                const costSet = genericBuyable.costSets[i];
                const cost = unref(costSet.cost);
                if (!unref(keepRes))
                    costSet.resource.value = Decimal.sub(costSet.resource.value, cost);
            }
            genericBuyable.amount.value = Decimal.add(genericBuyable.amount.value, 1);
        };
        processComputable(buyable as T, "display");
        const display = buyable.display;
        buyable.display = jsx(() => {
            // TODO once processComputable types correctly, remove this "as X"
            const currDisplay = unref(display) as MultiBuyableDisplay;
            if (isCoercableComponent(currDisplay)) {
                const CurrDisplay = coerceComponent(currDisplay);
                return <CurrDisplay />;
            }
            if (currDisplay != null && buyable.costSets.length > 0) {
                const genericBuyable = buyable as GenericMultiBuyable;
                const Title = coerceComponent(currDisplay.title || "", "h3");
                const Description = coerceComponent(currDisplay.description);
                const EffectDisplay = coerceComponent(currDisplay.effectDisplay || "");
                const amountDisplay =
                    unref(genericBuyable.purchaseLimit) === Decimal.dInf ? (
                        <>Amount: {formatWhole(genericBuyable.amount.value)}</>
                    ) : (
                        <>
                            Amount: {formatWhole(genericBuyable.amount.value)} /{" "}
                            {formatWhole(unref(genericBuyable.purchaseLimit))}
                        </>
                    );
                const costDisplay = genericBuyable.costSets.map(costSet => (
                    <div>
                        {format(unref(costSet.cost) || 0)} {costSet.resource.displayName}
                        <br />
                    </div>
                ));

                return (
                    <span>
                        {currDisplay.title ? (
                            <div>
                                <Title />
                            </div>
                        ) : null}
                        <Description />
                        <div>
                            <br />
                            {amountDisplay}
                        </div>
                        {currDisplay.effectDisplay ? (
                            <div>
                                <br />
                                Currently: <EffectDisplay />
                            </div>
                        ) : null}
                        {!genericBuyable.maxed.value ? (
                            <div>
                                <br />
                                Cost: {costDisplay}
                            </div>
                        ) : null}
                    </span>
                );
            }
            return "";
        });

        processComputable(buyable as T, "visibility");
        setDefault(buyable, "visibility", Visibility.Visible);
        for (let i = 0; i < (buyable as T).costSets.length; i++) {
            processComputable((buyable as T).costSets[i], "cost");
            processComputable((buyable as T).costSets[i], "resource");
        }
        processComputable(buyable as T, "purchaseLimit");
        setDefault(buyable, "purchaseLimit", Decimal.dInf);
        processComputable(buyable as T, "style");
        processComputable(buyable as T, "mark");
        processComputable(buyable as T, "small");

        buyable[GatherProps] = function (this: GenericMultiBuyable) {
            const { display, visibility, style, classes, onClick, canClick, small, mark, id } =
                this;
            return {
                display,
                visibility,
                style: unref(style),
                classes,
                onClick,
                canClick,
                small,
                mark,
                id
            };
        };

        return buyable as unknown as MultiBuyable<T>;
    }, persistent<DecimalSource>(0));
}
