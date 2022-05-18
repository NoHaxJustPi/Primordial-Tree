/**
 * @module
 * @hidden
 */
import { computed } from "@vue/reactivity";
import { createLayerTreeNode } from "data/common";
import { jsx, showIf, Visibility } from "features/feature";
import { createInfobox, Infobox, InfoboxOptions } from "features/infoboxes/infobox";
import { createLayer } from "game/layers";
import { renderJSX } from "util/vue";
import advancements from "./Advancements";
import light from "../row3/Light";
import sound from "../row3/Sound";

const layer = createLayer("lore", () => {
    const id = "lore";
    const name = "Lore";
    const color = "#f4d4ff";

    const loreData: Infobox<InfoboxOptions>[] = [
        createInfobox(
            () => ({
                visibility: Visibility.Visible,
                color: "#000000",
                title: "The Beginning",
                display: jsx(() => (
                    <>
                        So... you're telling me that I can make my own universe? Sweet!
                        <br />
                        <br />
                        No, I'm not going to back down just because I'm younger than you, let me
                        have this.
                        <br />
                        <br />
                        Great! So, I can just take these tools and get started then?
                        <br />
                        <br />
                        Alright, here goes!
                        <br />
                    </>
                )),
                titleStyle: {
                    color: "white"
                }
            }),
            true
        ),

        createInfobox(
            () =>
                ({
                    visibility: computed(() => showIf(advancements.milestones[0].earned.value)),
                    color: "#ffd500",
                    title: "A New Particle",
                    display: jsx(() => (
                        <>
                            Ooh I have news for you! I found a new primordial particle!
                            <br />
                            <br />
                            Oh... you've already heard of this one? I thought I made some kind of
                            discovery...
                            <br />
                            <br />
                            Yes, I did expect a universe to be normally made of only three particle
                            types, thank you.
                            <br />
                            <br />
                            Ugh I guess I'll just keep building this thing then, maybe you could
                            tell me things like this a little sooner next time?
                            <br />
                        </>
                    )),
                    style: {
                        color: "black"
                    }
                } as InfoboxOptions),
            true
        ),

        createInfobox(
            () =>
                ({
                    visibility: computed(() => showIf(advancements.milestones[2].earned.value)),
                    color: "#03f4fc",
                    title: "Frozen Solid",
                    display: jsx(() => (
                        <>
                            Oh let me guess, this one was already discovered too, right?
                            <br />
                            <br />
                            See, I knew it. Damn discovering new things is harder than I thought.
                            <br />
                            <br />
                            I guess particles that make things cold aren't really all that
                            interesting, and are probably completely useless, but hey why not put
                            them in too, right?
                            <br />
                            <br />
                            Time to keep making this boring universe...
                            <br />
                        </>
                    )),
                    style: {
                        color: "black"
                    }
                } as InfoboxOptions),
            true
        ),

        createInfobox(
            () =>
                ({
                    visibility: computed(() => showIf(advancements.milestones[3].earned.value)),
                    color: "#ffffff",
                    title: "Self Sustaining",
                    display: jsx(() => (
                        <>
                            Ah, my universe has finally reached the point where it can generate its
                            own particles! This has gotta be revolutionary, right?
                            <br />
                            <br />
                            No? You're saying that self-sustaining universes already exist? Ughhhh
                            what does it take to make something new?
                            <br />
                            <br />
                            Nah, I'll be able to make something unique, you may think it's all been
                            done before but I'm sure I'll stumble upon something unique soon.
                            <br />
                            <br />
                            You don't have to believe in me, just let me prove you wrong.
                            <br />
                        </>
                    )),
                    style: {
                        color: "black"
                    }
                } as InfoboxOptions),
            true
        ),

        createInfobox(
            () =>
                ({
                    visibility: computed(() => showIf(advancements.milestones[6].earned.value)),
                    color: "#ffd1fb",
                    title: "Sustenance of the Universe",
                    display: jsx(() => (
                        <>
                            Oh, so now I discover Air Particles? I would've thought that was needed
                            sooner, no? How can Flame Particles exist without some air to keep them
                            alive?
                            <br />
                            <br />
                            You're saying that there aren't rules here yet? I mean I guess I never
                            actually made those, but who cares? There should be some default rules
                            to keep things making sense, right?
                            <br />
                            <br />
                            No? I mean that could result in some wacky worlds, couldn't it? Don't we
                            want some kind of order in the multiverse?
                            <br />
                            <br />
                            Okay okay, jeez you don't have to yell, I know I shouldn't be asking
                            these things, I was just saying-
                            <br />
                            <br />
                            Ugh fine, I guess I'll just keep building the world like you asked, but
                            could I get some answers later?
                            <br />
                            <br />
                            Sweet! Thanks for the free motivation!
                            <br />
                        </>
                    )),
                    style: {
                        color: "black"
                    }
                } as InfoboxOptions),
            true
        ),

        createInfobox(
            () =>
                ({
                    visibility: computed(() => showIf(advancements.milestones[11].earned.value)),
                    color: "#733000",
                    title: "A Dense Mind",
                    display: jsx(() => (
                        <>
                            Yet another fundamental base for any universe, huh. I was really hoping
                            to find something interesting, something I haven't heard of being in a
                            universe before...
                            <br />
                            <br />
                            You may think that, but there are certainly more combinations of
                            particles in a universe than universes in the cosmos, or at least I
                            assume as much.
                            <br />
                            <br />
                            Oh, so you're telling me you know everything then? No. If I don't know
                            anything than neither do you, so don't claim otherwise.
                            <br />
                            <br />
                            Ugh whatever, I'm tired of talking at you. Can't you just have me talk
                            with one of your assistants or something? I'm sure you have a few to
                            spare.
                            <br />
                            <br />
                            Nobody cares about that tired old protocol, dammit, I'm bored and I
                            could use someone else to talk to. Eh regardless, I guess I'll just keep
                            going for now, but please just get me someone, thanks.
                            <br />
                        </>
                    )),
                    style: {
                        color: "black"
                    }
                } as InfoboxOptions),
            true
        ),

        createInfobox(
            () =>
                ({
                    visibility: computed(() => showIf(advancements.milestones[15].earned.value)),
                    color: "#03fca9",
                    title: "Brought Together",
                    display: jsx(() => (
                        <>
                            Wait you're still here? Fine I guess I'll suffer through you for the
                            time being if you're really going to be like that.
                            <br />
                            <br />
                            Whatever. So it seems I can combine particles into molecules now? That's
                            pretty sick, but I'd say it's something that exists in other universes
                            too, right?
                            <br />
                            <br />
                            Yep, thought so. I'm glad I didn't get my hopes up for this one. That
                            being said, this is pretty great, there are countless combinations to
                            make now!
                            <br />
                            <br />
                            Oh? So you're telling me that I don't have enough combinators to make
                            "countless combinations"? Damn you're always making things less
                            interesting...
                            <br />
                            <br />
                            Whatever. Enjoy your quiet time while I do all the work. I know you're
                            technically my boss but cmon, you could help a little. Anyways, time to
                            make some molecules, I guess.
                            <br />
                        </>
                    )),
                    style: {
                        color: "black"
                    }
                } as InfoboxOptions),
            true
        ),

        createInfobox(
            () =>
                ({
                    visibility: computed(() => showIf(advancements.milestones[23].earned.value)),
                    color: "#ff9100",
                    title: "Heartfelt Emotion",
                    display: jsx(() => (
                        <>
                            Ooh, so I can use these to strengthen molecules?
                            <br />
                            <br />
                            Look, I'm tired of your sass, okay? Just let me have a fun time with
                            this, or literally just leave, I couldn't care less.
                            <br />
                            <br />
                            Wait really? You'll actually leave? Damn okay, I guess I'll be alone in
                            this universe then, just me and the hundred quadrillion particles I
                            create every second...
                            <br />
                            <br />
                            Alright, enjoy your vacation or whatever, I'll keep building this
                            universe I guess.
                            <br />
                            <br />
                            Wait, you'll actually send one of your assistants to keep me company?
                            Wow I'm excited, I'll have someone fun to talk to!
                            <br />
                            <br />
                            Good! If you don't like them, I probably will, so please, send them over
                            as soon as possible. Goodbye forever!
                            <br />
                        </>
                    )),
                    style: {
                        color: "black"
                    }
                } as InfoboxOptions),
            true
        ),

        createInfobox(
            () =>
                ({
                    visibility: computed(() => showIf(advancements.milestones[32].earned.value)),
                    color: "#ffffff",
                    title: "Correction Major",
                    display: jsx(() => (
                        <>
                            Hello! Yes I'm the one making the universe here! Maybe I'm just a
                            novice, but that's what you're here for, right?
                            <br />
                            <br />
                            Wait what? You're saying that I'm underqualified for this? How dare you,
                            just because I skipped half of my classes doesn't mean-
                            <br />
                            <br />
                            Oh, you meant that I need experience before I can make a universe here?
                            But to get experience I'd need to make a universe, right?
                            <br />
                            <br />
                            So I need experience to make a universe, but need to make a universe to
                            have experience. Jeez, I'm no million-year-old genius but that sounds
                            like a paradox to me.
                            <br />
                            <br />
                            No, you cannot take control of this operation, it's mine! You have no
                            authority here, so leave or I'll throw over a septillion particles at
                            you! That oughta leave a dent!
                            <br />
                            <br />
                            Yeah you're right, that's barely anything, but still! You have no right!
                            I'll mind my business, and you mind yours! Or you could actually do your
                            job and help me out here!
                            <br />
                            <br />
                            Well, I guess it's time to add something to help people sense the world
                            around them, huh... What shall I do...
                            <br />
                        </>
                    )),
                    style: {
                        color: "black"
                    }
                } as InfoboxOptions),
            true
        )
    ];

    const treeNode = createLayerTreeNode(() => ({
        layerID: id,
        display: "L",
        color
    }));

    return {
        id,
        name,
        color,
        loreData,
        treeNode,
        display: jsx(() => (
            <>
                <table>
                    <tbody>
                        {loreData.map(infobox => (
                            <>
                                {renderJSX(infobox)}
                                <div style="margin-top: 0.5em;"></div>
                            </>
                        ))}
                    </tbody>
                </table>
            </>
        ))
    };
});

export default layer;
