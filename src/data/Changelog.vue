<template>
    <Modal v-model="isOpen">
        <template v-slot:header>
            <h2>Changelog</h2>
        </template>
        <template v-slot:body>
            <details open>
                <summary>v0.1 Basic Mechanics - <time>2022-04-08</time></summary>
                <ul>
                    <li class="feature">Implemented Flame, Life, & Water layers</li>
                    <li class="feature">Implemented Advancement 1</li>
                    <li class="feature">Implemented Lightning layer</li>
                </ul>
            </details>
            <details open>
                <summary>v0.2 Several Advancements - <time>2022-04-11</time></summary>
                <ul>
                    <li class="balancing">Balanced up to 43,000 Particles/s</li>
                    <li class="feature">Implemented Advancements 2-6</li>
                    <li class="feature">Implemented Cryo layer</li>
                </ul>
            </details>
            <details>
                <summary>v0.3 Windseeker - <time>2022-04-14</time></summary>
                <ul>
                    <li class="balancing">Balanced up to 40,500,000 Particles/s</li>
                    <li class="feature">Implemented Advancements 7-11</li>
                    <li class="feature">Implemented Air layer</li>
                </ul>
            </details>
            <details>
                <summary>v1.0 Our Planet - <time>2022-04-23</time></summary>
                <ul>
                    <li class="balancing">Balanced up to 3e9 Particles/s</li>
                    <li class="feature">Implemented Advancements 11-15</li>
                    <li class="feature">Implemented Earth layer</li>
                </ul>
            </details>
            <details>
                <summary>v1.0.1 Refined Edges - <time>2022-04-24</time></summary>
                <ul>
                    <li class="fix">Updated to Profectus v0.3.2</li>
                    <li class="fix">
                        Added glow color to certain layers (thanks to thepaperpilot)
                    </li>
                </ul>
            </details>
            <details>
                <summary>v1.0.2 Tooltip Heaven - <time>2022-04-24</time></summary>
                <ul>
                    <li class="fix">Updated to Profectus v0.3.3</li>
                    <li class="fix">Added tooltips to layer nodes (thanks to thepaperpilot)</li>
                    <li class="fix">
                        Added modifier tooltips to reset buttons (note that it's not in the Aqua
                        layer, it doesn't let you click the reset button when it is, so I had to
                        remove it for the time being while I try to figure that out)
                    </li>
                    <li class="fix">
                        Fixed the way that the branched reset propagation works (I really borked
                        that one up lol)
                    </li>
                </ul>
            </details>
        </template>
    </Modal>
</template>

<script setup lang="ts">
import Modal from "components/Modal.vue";
import { ref } from "vue";

const isOpen = ref(false);

defineExpose({
    open() {
        isOpen.value = true;
    }
});
</script>

<style scoped>
details {
    margin: 10px 0;
    padding-left: 18px;
}

summary {
    cursor: pointer;
    margin-bottom: 10px;
    margin-left: -18px;
}

ul {
    margin: var(--feature-margin) 0;
    background: var(--raised-background);
    border: 2px solid rgba(0, 0, 0, 0.125);
    padding: 5px 5px 5px 15px;
    list-style: inside;
}

li {
    margin: 8px 0;
}

li::before {
    padding: 2px 8px;
    margin-right: 8px;
    border-radius: var(--border-radius);
}

.feature::before {
    content: "Feature";
    background: var(--accent1);
}

.fix::before {
    content: "Fix";
    background: var(--accent2);
}

.balancing::before {
    content: "Balancing";
    background: var(--accent3);
}

.breaking::before {
    content: "Breaking";
    background: var(--danger);
}
</style>
