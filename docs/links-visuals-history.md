# History of attempts toward true links visuals

This history answers [issue #31][issue-31]: how did attempts to visualize links that can refer to other links develop, and what did each attempt achieve? It follows the references in the issue, their original discussions and code, relevant public work in [LinksPlatform][linksplatform] and [Deep Foundation][deep-foundation], and the experiments preserved here. Sources were checked on **2026-10-11**.

This is an inventory of identified public attempts, open to additions as earlier material is recovered. Dates identify a public comment, commit, or archived artifact, as specified below; they do not automatically establish a project's invention or release date. A source or demo link records evidence, not a guarantee that an old demo still runs in a current browser.

## What the visual needs to express

In the [links theory][theory-doublets], a doublet-link has a reference of its own and two references to links, conventionally source and target. For example:

```text
1: (1, 1)   a link whose source and target both refer to itself
2: (2, 2)   another such link
3: (1, 2)   a link between those two links
4: (3, 2)   a link starting from link 3 and ending at link 2
5: (3, 4)   a link between two links that themselves connect links
```

The theory's [network illustrations][theory-figures] depict self-reference using a closed arrow resembling an infinity symbol. The practical visual goal is to make a link's identity and its source/target references readable, including when a reference names another connecting link. Recursive structure and self-reference also need to remain understandable during interaction.

Several approaches below use ordinary graph nodes as proxies for links. Those encodings can preserve the references and support useful tools. Whether the picture shows a connection to the actual curve, to a proxy node, or only to a nested textual representation is a separate question. The descriptions distinguish these choices rather than treating every graph view as the same result.

## Timeline

| Date or period | Attempt and evidence | Contribution and remaining boundary |
| --- | --- | --- |
| 2015-09-16 archive; one page stamped 2011-05-11 | LinksPlatform [Web UI prototypes 1 and 2][web-ui-original] | Hyperlinked descriptions and nested trees expose link structure. The HTML mirror timestamp is evidence of an older artifact, not a verified launch date. |
| 2015-11-12 | LinksPlatform [doublet][doublet-symbol] and [triplet][triplet-symbol] SVG symbols | Nested circles explore how one link can contain references; these are symbols rather than an editor for a network. |
| 2016-01-10–14 | Konard's [Cytoscape.js request #1217][cytoscape-request] and the [maintainer's decision][cytoscape-decision] | An edge whose endpoints name edges did not display. Native support was declined because it conflicted with Cytoscape's graph model and algorithms; intermediary and compound nodes were suggested. |
| 2016-01-12 | LinksPlatform [closed-link Bézier experiment][closed-link-commit] | An animated, draggable curve explores a link starting and ending at itself. It handles one shape, not an arbitrary link network. |
| 2016-01-15 | LinksPlatform [intermediary and compound-node demos][cytoscape-demos-comment] | Two implemented workarounds support recursive expansion/collapse while retaining ordinary Cytoscape nodes and edges. |
| By 2016-03-25 | Konard [records the GoJS links-to-links sample][gojs-comment] | Link-owned label nodes make connectors appear to attach to other links and follow their movement. The underlying endpoints remain nodes. |
| 2018-11–2019-01 | [Additional users][cytoscape-support] and Jörg Richter's [extension announcement][extension-announcement] | The discussion continues; a community extension supplies edge connections without changing Cytoscape core. |
| 2018-12-30 / 2019-01-02 | [cytoscape-edge-connections][extension-history], initial functional version / general-purpose version | Synchronized auxiliary nodes overlay existing edges. Curves remain intact; the renderer still uses nodes for attachment. |
| 2020-03-23 | LinksPlatform [circles-ring experiment][circles-ring-commit] | Clicking changes the number of circles inside an enclosing circle, extending the earlier nested-circle symbols. It does not implement references between drawn curves. |
| 2020-07–08 | [RawDoubletsViewer alpha][raw-viewer-commit], [InfiniteDepthTreeWebUIPrototype extraction][tree-extraction], and [react-deep-tree][react-tree] | A raw record viewer and navigable tree interfaces explore inspecting stored links and deep structure. These are alternative interfaces to the data. |
| 2021-09–11 | LinksPlatform [doublets stack drawings][stack-commit] and [introduction animation draft][intro-animation-commit] | Further static and animated visual explanations are preserved alongside the interactive prototypes. |
| 2022-07 / 2023-07 | Deep.Case [Cytoscape source in deepcase-app][deepcase-app-commit], then [deepcase package][deepcase-package-commit] and [A-Frame graph data][aframe-commit] | Links become addressable graph nodes, with separate edges for references. Both 2D and 3D projections are explored. These dates mark source milestones, not the first Deep.Case release. |
| 2025-02–04 | This repository's [straight link][straight-link-commit], [H-fractal][h-fractal-commit], [blueprint][blueprint-commit], and [IK experiments][ik-commit] | Geometry develops from a directed line to recursive layouts, editable splines, and constrained link animation. |
| 2025-04-17 onward | Deep Foundation [DeepVisual implementation][deepvisual-commit] | Python plots include infinity-shaped loops and arrows between previously positioned links. The implementation has ordering and representation limits. |
| 2026-03 | This repository's [grid PRs][grid-pr] | Several links can be displayed together, with interactive endpoints and grid snapping. |
| 2026-05-08 | LinksPlatform [doublets-web playground][doublets-web-commit] | Live doublets data gets an SVG graph view beside a JavaScript editor; attachment is to ID nodes rather than to a represented link's curve. |
| 2026-06 | This repository's [proportion fix][grid-fix-pr] and [drawing-to-link demo][draw-pr] | Multiple-link geometry becomes consistent; drawn endpoints can pin to another link's center and follow its movement. |
| 2026-08-22 | [Issue #31][issue-31] | The request to bring these attempts together into a traceable history. |

The rest of this document explains the implementation choices behind these milestones. Chronology alone does not imply that one project reused another's code.

## LinksPlatform: symbols, self-reference, and recursive browsing

### Early web interfaces and symbols

The [2015 archive commit][web-ui-original] contains two earlier interfaces. [Prototype 1][web-ui-1] presents source/linker/target descriptions as hyperlinks and lists referring links. Its HTML says it was mirrored on 2011-05-11. [Prototype 2][web-ui-2] represents descriptions using nested lists. The public commit establishes their preservation by September 2015; the mirror header alone cannot date the original application's development.

The November 2015 [doublet][doublet-symbol] and [triplet][triplet-symbol] pages represent a containing circle with two or three smaller circles. The [2020 circles-ring page][circles-ring-source] generalizes that construction interactively. They explore visual vocabulary for reference structure, without demonstrating a connection from one drawn arrow to another.

The January 2016 [closed-link experiment][closed-link-source] uses seven initial control points with the first, middle, and last at the same location. D3 animates Bézier interpolation and lets the user drag the controls. Its [introduction commit][closed-link-commit] explicitly identifies self-reference as the purpose. This makes the geometry of a self-referencing link visible, but has no collection of link IDs or attachments between multiple curves.

### The Cytoscape request and the two workarounds

On 2016-01-10, [Konard asked Cytoscape.js][cytoscape-request] to display an edge whose source and target were the IDs of two other edges. The request also included sketches of node-to-edge, edge-to-edge, and recursively encapsulated structures. Konard [clarified][cytoscape-clarification] that the intended relation was binary, with links as both endpoints, rather than an arbitrary-arity hyperedge.

On January 13, [Max Franz declined native support][cytoscape-decision] after discussing it with the team: Cytoscape's traversal and other algorithms depended on its node/edge model. He suggested application-level nodes or an extension; [the next reply][cytoscape-alternatives] explained intermediary and compound nodes. This records a library design decision, rather than establishing a prohibition on every possible mathematical or visual model.

Konard [posted two implemented examples on January 15][cytoscape-demos-comment], also preserved in the [introduction commit][cytoscape-demos-commit]:

| Example | Mechanism in the source | What it demonstrates |
| --- | --- | --- |
| [Intermediary nodes][intermediary-source] · [demo][intermediary-demo] | Holding a node adds source and target nodes with edges `source → node → target`; holding again removes its generated descendants. | A link can be represented by a node and two reference edges, with repeated expansion. The link is visually split into graph elements. |
| [Compound nodes][compound-source] · [demo][compound-demo] | Holding a node creates two child nodes and an edge inside that parent; holding again removes the children. | Recursive containment can be explored, while connections still have graph nodes as endpoints. |

Both handlers rerun the Dagre layout. They establish working responses to the suggestion, with different visual tradeoffs from attaching a connector to an intact link curve.

### Later viewers and explanatory material

The [RawDoubletsViewer alpha commit][raw-viewer-commit] dates to July 19, 2020. Its [Win32 list-view code][raw-viewer-source] displays stored records, including source and target fields. It supplies direct inspection of doublets, rather than a geometric renderer of connections between them.

[InfiniteDepthTreeWebUIPrototype][tree-prototype] was [moved out of Documentation on July 20, 2020][tree-extraction]. Its README describes viewing and editing deep graphs through a tree, including structures with self-references. [react-deep-tree][react-tree] explicitly identifies that prototype as its starting point and provides a React component for navigating nested content. The tree representation is useful for browsing; it is a different view from depicting shared identity and connections between curves on one canvas.

The [September 2021 stack drawings][stack-commit] preserve SVG, raster, and editable artwork under [Documentation's visualization archive][visualizations-archive]. The [November introduction animation draft][intro-animation-commit] adds an SVG animation and an HTML wrapper. These are explanatory visual artifacts; neither commit establishes a general interactive links editor.

## GoJS: an early implementation using link label nodes

On [March 25, 2016][gojs-comment], Konard linked to the GoJS example in the Cytoscape discussion. [Issue #31][issue-31] recalls it as the only implementation he had seen before the later supporters. The comment establishes that the example was known by that date; it does not establish when Northwoods first released it.

The [official sample][gojs-sample] shows node-to-link and link-to-link connections. It explains that link-owned label nodes serve as connection points and that newly drawn links receive label nodes automatically. Moving the original nodes updates the connections. This achieves the visual effect through GoJS's node/label mechanism, while retaining separate node and link types in the underlying diagram model.

## Community support: cytoscape-edge-connections

In [November 2018][cytoscape-support], another user raised layout concerns with intermediary nodes. In [December][associative-support], Jörg Richter distinguished the associative model from the graph model. On [January 2, 2019][extension-announcement], he announced an extension, originally linked under `jri/cytoscape-edge-connections` and now hosted at [dmx-systems/cytoscape-edge-connections][extension].

Its [version history][extension-history] dates the functional initial version to December 30, 2018, and the general-purpose version to January 2, 2019. The [implementation documentation][extension-mechanism] describes an auxiliary node superimposed on each connectable edge, synchronized with its position. It keeps the original edge intact, unlike the two-edge intermediary representation. The [demo][extension-demo] accompanies that implementation.

The API accepts edge IDs as endpoints through the extension's `addEdge`/`addEdges` methods. Ordinary Cytoscape edge creation does not provide that behavior. Auxiliary nodes remain the actual attachment points in the renderer; this is an extension-based encoding rather than native unification of nodes and edges. It is a concrete community response to the earlier limitation.

## Deep Foundation: graph projections and direct plots

### Deep.Case in 2D and 3D

The available [deepcase-app source history][deepcase-app-commit] includes Cytoscape components by July 2022. In July 2023, [deepcase][deepcase-package-commit] contains the extracted visualization package; [deepcase-app's README][deepcase-app] identifies the app as using that package. These are verifiable repository milestones, not a claim about the first version of Deep.Case.

In the default [Cytoscape element builder][deepcase-elements], each stored link gets a `link-node` carrying its ID. Separate `link-from`, `link-to`, and optional `link-type` edges connect that node to nodes representing the referenced links. Because references point to link IDs, another link can refer to a connecting link through its node representation. Custom Cyto handlers are also present; this description concerns the default projection.

The [A-Frame graph-data builder][aframe-data] also creates a node for each link and reference edges, including `from → link → to` and type references. Its [addition in July 2023][aframe-commit] records a 3D visualization path. Both projections preserve addressable links through graph nodes; they do not demonstrate endpoints attached directly to arbitrary displayed curves.

### DeepVisual

The [DeepVisual repository][deepvisual] describes a Python visualization library. Its code was [introduced on April 17, 2025][deepvisual-commit]. In the reviewed [implementation][deepvisual-source], `visualize_link_doublet` draws infinity-shaped loops, stores positions for ordinary links, and draws further arrows to the midpoints of those links. This is a direct attempt to show links between links, alongside conventional doublet/triplet graph plotting functions.

The code also defines its boundaries: link IDs are derived from `DataFrame` row indices plus one; positions are collected during row-order traversal; and the displayed endpoints must already have usable positions. The deeper arrows' positions are not registered in the same map for further attachment. Also, its loop classification tests `from == to`, which alone does not establish that both references equal the link's own ID. These are observations about that source snapshot, so it should not be presented as a verified renderer for every recursive network.

## This repository: geometry, layout, and connected drawing

The [February 2025 starting point][straight-link-commit] builds a directed line with start/end markers and draggable endpoints. The [H-fractal attempt][h-fractal-commit] in March explores recursive spatial structure using smaller arrows. April brings the [spline blueprint][blueprint-commit], [distance constraints][distance-commit], [half-link animation][half-link-commit], and [FABRIK-driven blueprint][ik-commit]. These address how a link changes shape, including loops, before providing a general network layout.

The current pages preserve several approaches:

| Page | Purpose | Boundary relevant to this history |
| --- | --- | --- |
| [index.html](../index.html) | Directed line, markers, and draggable endpoints. | One line's appearance and controls. |
| [H-fractal.html](../H-fractal.html) | Click-driven recursive subdivision with straight arrows. | A generated fractal layout rather than an editor for arbitrary stored references. |
| [blueprint.html](../blueprint.html) | Configurable link spline with control points and markers. | A single link's geometry. |
| [distance-constrained-blueprint.html](../distance-constrained-blueprint.html) | Endpoint dragging with constrained half-chains. | An alternative single-link constraint experiment. |
| [fabrik.html](../fabrik.html) and [fabrik-horizontal.html](../fabrik-horizontal.html) | Vertical/horizontal constant-curvature IK experiments. | Half-chain behavior, not a network. |
| [animated-blueprint.html](../animated-blueprint.html) | IK-driven link geometry with shared rendering modules. | How one link bends and loops. |
| [tests.html](../tests.html) | Geometry cases including loops and wave-like configurations. | A geometry test harness. |
| [grid.html](../grid.html) | Several colored links with fixed centers and movable endpoints. | Spatial placement and snapping; coincident positions alone do not create persistent link-ID references. |
| [draw.html](../draw.html) | Freehand strokes become links; endpoints can pin to existing centers. | Explicit center attachment, with geometry derived from drawing. |

The March 2026 [grid additions][grid-pr] were followed by [interaction changes][grid-controls-pr] and [control-style corrections][grid-style-pr]. The [June proportion fix][grid-fix-pr] reconciled their appearance with the single-link blueprint. This sequence matters because showing several shapes consistently is another step beyond producing one attractive link.

The [June drawing demo PR][draw-pr] adds a more explicit connection mechanism. In [draw-link.mjs](../js/draw-link.mjs), `startAnchorId` and `endAnchorId` refer to other drawn links, and `applyCenterAnchors` resolves their centers. The existing [drawing E2E tests](../tests/draw.e2e.test.mjs) verify that a child endpoint stays pinned when its parent center moves. This demonstrates references to other displayed links; it does not establish automatic layout of every cyclic or deeply recursive links network.

### Preserved attempts

The directory name `failed-attempts` records the repository's own classification. It does not supply a separate failure diagnosis or date for each file. The following inventory includes **all 76 HTML snapshots currently preserved there**, including the nested self-reference experiments:

| Archive | HTML snapshots | Subject preserved |
| --- | ---: | --- |
| [blueprints](../failed-attempts/blueprints/) | 32 | Iterations on spline geometry, markers, and control points. |
| [animated-blueprints](../failed-attempts/animated-blueprints/) | 4 | Animation and IK iterations. |
| [distance-constrained-blueprints](../failed-attempts/distance-constrained-blueprints/) | 14 | Alternative endpoint/segment constraints. |
| [fabriks](../failed-attempts/fabriks/) | 7 | Half-chain solver experiments. |
| [self-referenced-link](../failed-attempts/self-referenced-link/) | 7 | Initial self-reference experiments. |
| [self-referenced-link/2](../failed-attempts/self-referenced-link/2/) | 10 | Further D3 self-reference experiments. |
| [self-referenced-link/3](../failed-attempts/self-referenced-link/3/) | 2 | Another pair of self-reference attempts. |

Their filenames are preserved identifiers, not verified chronological order. The [experiment directory](../experiments/) and [issue case studies](case-studies/) also retain later marker investigations, tests, and screenshots. [Issue 27's case study](case-studies/issue-27/README.md) and [issue 28's case study](case-studies/issue-28/README.md) explain the drawing and grid work in detail.

## LinksPlatform doublets-web: live data with a graph view

The [May 8, 2026 playground commit][doublets-web-commit] adds an editor and graph view to [doublets-web][doublets-web]. This dates the visualization addition, separately from the older storage-binding project. In its [SVG renderer][doublets-web-renderer], link IDs and endpoint IDs receive circular graph-node positions, while each record becomes a line or loop labeled by its ID.

This gives a useful visual companion to live doublets queries. A reference to another link reaches that link's ID node, whose position is distinct from its labeled line. It therefore belongs in the history as a storage-connected graph projection with a different representation from curve-to-curve attachment.

## What these attempts leave to explore

The sources show progress in several directions: readable reference structure, closed self-referencing shapes, attachments that follow a moving curve, browsing deep data, consistent geometry for multiple links, and explicit references between drawn links.

The remaining goal is to combine those properties: stable identity, arbitrary source/target references, self-reference and cycles, understandable recursive structure, and layout that stays readable as links move. Single-link geometry demos, tree browsers, and graph encodings provide evidence for parts of that goal. Their existence alone does not establish a complete solution.

To extend this record, add a primary source and its date, describe the actual representation, and state what was demonstrated versus what remains unverified. Preserve original project names and moved-repository links. Where an older artifact's date or behavior is uncertain, record the uncertainty instead of assigning an invented milestone.

[issue-31]: https://github.com/konard/links-visuals/issues/31
[linksplatform]: https://github.com/linksplatform
[deep-foundation]: https://github.com/deep-foundation
[theory-doublets]: https://github.com/link-foundation/meta-theory/blob/d5923a7d0996ab4abf70bf03e9f212e3d1a8e6cc/archive/0.0.2/article.md#duplets
[theory-figures]: https://github.com/link-foundation/meta-theory/blob/d5923a7d0996ab4abf70bf03e9f212e3d1a8e6cc/archive/0.0.2/article.md#directed-graph
[web-ui-original]: https://github.com/konard/LinksPlatform/commit/ccc3d91811c8f087ed92482e0360201a1d890019
[web-ui-1]: https://github.com/linksplatform/Documentation/blob/2c956554155df5845e56d14258e62367fcd7ec72/doc/WebUIPrototypes/1/index.html
[web-ui-2]: https://github.com/konard/LinksPlatform/blob/ccc3d91811c8f087ed92482e0360201a1d890019/doc/WebUIPrototypes/2/index.html
[doublet-symbol]: https://github.com/linksplatform/linksplatform.github.io/commit/2088f2de1ed9a8c77c37c711100b0b1396386ba5
[triplet-symbol]: https://github.com/linksplatform/linksplatform.github.io/commit/3fba6e5b2cfefc5ad85cfda4ee05cb73514ae730
[cytoscape-request]: https://github.com/cytoscape/cytoscape.js/issues/1217
[cytoscape-clarification]: https://github.com/cytoscape/cytoscape.js/issues/1217#issuecomment-170645381
[cytoscape-decision]: https://github.com/cytoscape/cytoscape.js/issues/1217#issuecomment-171296776
[cytoscape-alternatives]: https://github.com/cytoscape/cytoscape.js/issues/1217#issuecomment-171680730
[closed-link-commit]: https://github.com/linksplatform/linksplatform.github.io/commit/84cdf4abd53674b1e1e062223675549be47ff008
[closed-link-source]: https://github.com/linksplatform/linksplatform.github.io/blob/86d085b7f58b2b2d459cc00078a243e376493cdf/itself-animated-bezier.js
[cytoscape-demos-comment]: https://github.com/cytoscape/cytoscape.js/issues/1217#issuecomment-172003381
[cytoscape-demos-commit]: https://github.com/linksplatform/linksplatform.github.io/commit/13290f2dfd96d0f6c2c3b2e9259ee67b82ec2afb
[intermediary-source]: https://github.com/linksplatform/linksplatform.github.io/blob/86d085b7f58b2b2d459cc00078a243e376493cdf/cytoscape-intermediate.html
[compound-source]: https://github.com/linksplatform/linksplatform.github.io/blob/86d085b7f58b2b2d459cc00078a243e376493cdf/cytoscape-compound.html
[intermediary-demo]: https://linksplatform.github.io/cytoscape-intermediate.html
[compound-demo]: https://linksplatform.github.io/cytoscape-compound.html
[gojs-comment]: https://github.com/cytoscape/cytoscape.js/issues/1217#issuecomment-201497256
[gojs-sample]: https://gojs.net/latest/samples/linksToLinks
[cytoscape-support]: https://github.com/cytoscape/cytoscape.js/issues/1217#issuecomment-435869891
[associative-support]: https://github.com/cytoscape/cytoscape.js/issues/1217#issuecomment-447176603
[extension-announcement]: https://github.com/cytoscape/cytoscape.js/issues/1217#issuecomment-450914137
[extension]: https://github.com/dmx-systems/cytoscape-edge-connections
[extension-history]: https://github.com/dmx-systems/cytoscape-edge-connections/blob/1eadbcbb0232ac8549296c0771d51c89cb003d56/README.md#version-history
[extension-mechanism]: https://github.com/dmx-systems/cytoscape-edge-connections/blob/1eadbcbb0232ac8549296c0771d51c89cb003d56/README.md#description
[extension-demo]: https://dmx-systems.github.io/cytoscape-edge-connections
[circles-ring-commit]: https://github.com/linksplatform/linksplatform.github.io/commit/a22a8d66c8493a3126baa096e6c1dc74ba1127c2
[circles-ring-source]: https://github.com/linksplatform/linksplatform.github.io/blob/86d085b7f58b2b2d459cc00078a243e376493cdf/circles-ring.html
[raw-viewer-commit]: https://github.com/linksplatform/RawDoubletsViewer/commit/351e4d6843edc6c61747c541dc8b6a3360eb052b
[raw-viewer-source]: https://github.com/linksplatform/RawDoubletsViewer/blob/9ce26288b58c9e446418173f5292601a8e4212e1/winapi/main.cpp
[tree-extraction]: https://github.com/linksplatform/InfiniteDepthTreeWebUIPrototype/commit/6962b2bf902041894fd5c5298f3cabb75a692a0e
[tree-prototype]: https://github.com/linksplatform/InfiniteDepthTreeWebUIPrototype/blob/236c3109c9707495c7e86399285ae7ab6df5bb52/README.md
[react-tree]: https://github.com/linksplatform/react-deep-tree/blob/728d5198ca372af444620eb06ccade9c024eb3ae/README.md
[stack-commit]: https://github.com/linksplatform/Documentation/commit/f553c48d2740993cc6ffe0bd6926a95061dc06fa
[visualizations-archive]: https://github.com/linksplatform/Documentation/tree/2c956554155df5845e56d14258e62367fcd7ec72/doc/Visualizations/Stack
[intro-animation-commit]: https://github.com/linksplatform/linksplatform.github.io/commit/ff44317eddf17bb530a7da1b790129e9fa574da6
[deepcase-app-commit]: https://github.com/deep-foundation/deepcase-app/commit/13fdc7cac9d1c42f9730d45cf50f3a502ed86ff2
[deepcase-package-commit]: https://github.com/deep-foundation/deepcase/commit/01fc9aa5fd9ee13d8f2e36f50fc6e2139c1aeee9
[deepcase-app]: https://github.com/deep-foundation/deepcase-app/blob/7dff96d33989e9734d08cb3358365a199bff071e/README.md
[deepcase-elements]: https://github.com/deep-foundation/deepcase/blob/18cfcad059f66d6697cae31584027e486f894989/imports/cyto/elements.tsx
[aframe-commit]: https://github.com/deep-foundation/deepcase/commit/aef635dba88c0dc059bf431d5bb2e34ad5c3edc6
[aframe-data]: https://github.com/deep-foundation/deepcase/blob/18cfcad059f66d6697cae31584027e486f894989/imports/aframe/get-graph-data.ts
[straight-link-commit]: https://github.com/konard/links-visuals/commit/edca0a13288aaf24f5920aed241b05d13e0eb867
[h-fractal-commit]: https://github.com/konard/links-visuals/commit/8de2cd108ef32a5c6577d2662672d76d7eb6001c
[blueprint-commit]: https://github.com/konard/links-visuals/commit/cc122a26fa1bea929559397ac16698b971270b65
[half-link-commit]: https://github.com/konard/links-visuals/commit/502a6a882c83c3e344690ea240896fc450f0acfc
[distance-commit]: https://github.com/konard/links-visuals/commit/7753c2ac1892778730ed4937f87c338566c620d4
[ik-commit]: https://github.com/konard/links-visuals/commit/8da8b6dd02538c49e908ecec1340b7cb20d536dc
[deepvisual]: https://github.com/deep-foundation/deep-visual
[deepvisual-commit]: https://github.com/deep-foundation/deep-visual/commit/3f6d7d78a10f686434fd6d7a871d7f5149fa800a
[deepvisual-source]: https://github.com/deep-foundation/deep-visual/blob/6ff8d3e559c809bcd878eb2f549a54dc5d757447/deepvisual/__init__.py
[grid-pr]: https://github.com/konard/links-visuals/pull/24
[grid-controls-pr]: https://github.com/konard/links-visuals/pull/25
[grid-style-pr]: https://github.com/konard/links-visuals/pull/26
[grid-fix-pr]: https://github.com/konard/links-visuals/pull/29
[draw-pr]: https://github.com/konard/links-visuals/pull/30
[doublets-web]: https://github.com/linksplatform/doublets-web
[doublets-web-commit]: https://github.com/linksplatform/doublets-web/commit/90b59bcb26ce73388dcf4276e57fdacf48717d5f
[doublets-web-renderer]: https://github.com/linksplatform/doublets-web/blob/ea81d54d3ee48793f0cea5ec83a960eaaea96ec2/site/src/main.ts#L565
