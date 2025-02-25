<script lang="ts">

import { getGPUTier } from 'detect-gpu';
import { onMount } from "svelte";
import { fade } from "svelte/transition";
import { ImageRenderer } from "../effects/work-slider/renderer";
import { letterSlideIn, letterSlideOut, maskSlideIn, maskSlideOut, workImageIntro, workListIntro } from "../animations";
import { isMobile, isWorkScroll, loadPagePromise, workAnchor, workScrollSpeed, workItemsFetch,  fetchMediumArticlesFromAPI, articlesItemsFetch } from "../store";

import { loadImage } from "../utils";

/* Slider calculations and rendering */
class WorkSlider {

	currentMouseX = 0;
	initialMouseX = 0;
	currentPosition = 0;
	targetPosition = 0;
	initialPosition = 0;
	offsetSpeed = 5000;
	lerpSpeed = 0.1;

    onHold = e => {
        if (currentActive != null || isMouseDown || e.target.classList.contains("button")) return;

        this.initialMouseX = e.clientX;
		this.currentMouseX = e.clientX;
        isWorkScroll.set(true);

        if (isMouseDown) {
            let style = window.getComputedStyle(listContainer);
            let matrix = new WebKitCSSMatrix(style.transform);

            this.initialPosition = matrix.m41;
        }
    }

    onRelease() {
        isWorkScroll.set(false);
    }

    onMouseMove = e => {
    	if (!isMouseDown) return;
		this.currentMouseX = e.clientX;

        let diff = (this.currentMouseX - this.initialMouseX) * -1;
		this.targetPosition = Math.round((this.initialPosition - (this.offsetSpeed * (diff / document.body.clientWidth))) * 100) / 100;
    }

    animate = () => {
		if (currentActive === null) {
			let endPoint = listContainer.offsetWidth - document.body.clientWidth
			if (endPoint < 0) endPoint = listContainer.offsetWidth;

			// Checks for disabling overscrolling
			if (this.targetPosition > 0) this.targetPosition = 0;
			if (this.targetPosition <= (endPoint * -1)) this.targetPosition = - endPoint;
		}

        // Lerp easing
        this.currentPosition = this.lerp(this.currentPosition, this.targetPosition, this.lerpSpeed);

        workScrollSpeed.set(Math.round((this.currentPosition - this.targetPosition) * 100) / 100); // Set Svelte Store value for the Canvas effect
        listContainer.style.transform = `translate3d(${ Math.round(this.currentPosition * 100) / 100 }px, 0px, 0px)`;

        requestAnimationFrame(() => this.animate());
    }

	lerp(start, end, t) {
		return start * (1 - t) + end * t;
	}
}


let workContainer;
let container, listContainer; // Containers for Threejs meshes
let images = []; // Array of images to be passed to WebGL Shader
let workItems = []; // Array of workItems to be animated

let breakTitleWords: boolean = false;

let isMouseDown: boolean = false; // is user holding click
let currentActive: number = null; // Active work item in the detailsViewer viewed

let data; // JSON Work data fetched from the data.json file

// Intersection observer and promise to enable scroll activated animations
let inViewResolve;
let inView = new Promise((resolve) => inViewResolve = resolve);
let animationObserver = new IntersectionObserver((entries) => {
	entries.forEach(entry => {
		if (entry.isIntersecting) {
			inViewResolve();
			animationObserver.disconnect();
		}
	});
}, {
	root: null,
	threshold: 0.4
});

// Svelte Store subscriptions
isWorkScroll.subscribe(val => isMouseDown = val);

const slider = new WorkSlider(); // workItems slider functionality

onMount(async () => {

	// // Fetch the list IDs
	// await fetchMediumListsFromAPI();

	// // Fetch details for each list item and update the store
	// $listItemsFetch.lists && await fetchAllListDetails($listItemsFetch.lists);


	// GPU Tier to decide if effects should be enabled
	const gpuTier = await getGPUTier();
	// Svelte store for checking if device is a mobile device
	$isMobile = gpuTier.isMobile;

	// Fetch articles from API
	// fetchMediumArticlesFromAPI();
	// data = await articlesItemsFetch;

	// User mock json data (fetched from work-data.json)
	data = await workItemsFetch;
	await loadPagePromise;
	$workAnchor = workContainer;

	listContainer.style.transform = "translate3d(0px, 0px, 0px)";

	 // Begin slider animations and effects if device is not a phone
	if (!gpuTier.isMobile) slider.animate();
	// ThreeJS warping effect if device can handle it
	if (gpuTier.tier >= 2 && !gpuTier.isMobile && gpuTier.fps >= 30) new ImageRenderer(container, images);

	// Intersection observer for scroll animations
	animationObserver.observe(workContainer);
});

// Move slider to active item when it is active
function toggleActiveItem(i) {
	currentActive = (currentActive == i) ? null : i;
	if (currentActive != null) slider.targetPosition = -(workItems[i].offsetLeft - (window.innerWidth / 4) + window.innerWidth / 10);
}

// Prevents clipping of animated letters that have overhang
function adjustLineHeight(node) {
	if (/[gyjqp]/g.test(node.innerText)) node.style.lineHeight = "120%";
}

function titleSlide(node) {
	let title = letterSlideIn(node, { delay: 5, breakWord: false });
	title.anime({
		onComplete: () => breakTitleWords=true
	});
}

</script>

<div id="content-container" class="work-click-area" style = "margin-top: 30vh;" bind:this="{workContainer}">
	<div class="content-wrapper"
		on:mousedown|preventDefault={slider.onHold}
		on:mouseup={slider.onRelease}
		on:mouseleave={slider.onRelease}
		on:mousemove|preventDefault={slider.onMouseMove}
		bind:this={container}
		class:disabled={currentActive !== null}
		use:workListIntro={{ promise: inView }}
	>
		<div class:mobile={$isMobile}>
			<ul class="work-list"
				bind:this={listContainer}
				class:hold={isMouseDown}>

				<!-- {#await $articlesItemsFetch}
					<p>Loading articles...</p>
				{:then items}
					{#each items as item, i}
							<li>
								<div class="list-item clickable passive"
									class:ambient="{ currentActive !== i && currentActive !== null }"
									class:active="{ currentActive === i }">

									<div class="img-wrapper">
										{#if item.details.image_url}
											<img src="{item.details.image_url}" alt="{item.title} Background" on:dragstart|preventDefault draggable="false">
										{:else}

											<img src="path-to-your-placeholder-image.jpg" alt="Placeholder image">
										{/if}
									</div>
									<div class="text-top-wrapper">
										<p class="item-index">
											{(i.toString().length > 1) ? (i+1) : "0"+(i+1).toString()}
										</p>
									</div>
									<div class="text-wrapper">
										<h1 class="item-title">
											<span>
												{item.title}
											</span>
										</h1>
										<div class="button item-link" on:click={() => toggleActiveItem(i)}>
											view
										</div>
									</div>
								</div>
							</li>
					{/each}
				{:catch error}
					<p>There was an error loading the articles: {error.message}</p>
				{/await} -->

				<!-- Work items -->

				<!-- {#await $articlesItemsFetch}
					<p>Loading articles...</p>
				{:then items} -->
				{#await workItemsFetch then items}
					{#each items as item, i}
						<li use:workImageIntro={{ promise: inView, delay: i*30 }}>
							<div class="list-item clickable passive"
								class:ambient="{ currentActive !== i && currentActive !== null }"
								class:active="{ currentActive === i }"
								bind:this={ workItems[i] }>

								<div class="img-wrapper">
									{#await loadImage(item.image_url) then src}
										<img bind:this={images[i]} src="{src}" on:dragstart|preventDefault draggable="false" alt="{item.title} Background">
									{/await}
								</div>
								{#await inView then _}
									<div class="text-top-wrapper" class:hidden={currentActive != null || isMouseDown}>
										<p
											class="item-index"
											in:maskSlideIn={{
												delay: (i*30)+100,
												reverse: true
											}}>
											{(i.toString().length > 1) ? (i+1) : "0"+(i+1).toString()}
										</p>
									</div>
									<div class="text-wrapper" class:hidden={currentActive != null || isMouseDown}>
										<h1
											class="item-title"
											>
											<span in:maskSlideIn={{
												duration: 900,
												delay: (i*30)+300,
												reverse: true
											}}>
												{item.title}
											</span>
										</h1>
										<div
											class="button item-link"
											on:click={() => toggleActiveItem(i)}
											in:maskSlideIn={{
												duration: 900,
												delay: (i*30)+450,
												reverse: true
											}}>
											view
										</div>
									</div>
								{/await}
							</div>
						</li>
					{/each}
				{/await}

			</ul>
		</div>

		<!-- Active work item details (When a work item is clicked) -->
		{#if currentActive !== null}
			<div class="details-container">
				<div class="wrapper">
					<div class="top-align">
						<div class="wrapper">
							<div class="index">
								<div in:maskSlideIn out:maskSlideOut>
									{#if (currentActive < 9)}
										{"0"+(currentActive+1)}
									{:else}
										{currentActive+1}
									{/if}
								</div>
							</div>
							<span class="line" transition:fade></span>
							<h6 class="caption">
								<div in:maskSlideIn out:maskSlideOut>{data[currentActive].details.summary}</div>
							</h6>
						</div>
					</div>

					<div class="mid-align">
						<h1 class="title"
							use:titleSlide
							out:letterSlideOut
							use:adjustLineHeight
							class:breakTitleWords
							on:introend={() => setTimeout(() => breakTitleWords = true, 100)}
							on:outrostart={() => setTimeout(() => breakTitleWords = false, 100)}>

							{data[currentActive].title}
						</h1>
						<div class="close-button-wrapper" on:click={() => toggleActiveItem(currentActive)}>
							<div
								class ="close-button"
								in:maskSlideIn={{ reverse: true }}
								out:maskSlideOut>

								&times;
							</div>
						</div>
					</div>

					<div class="bottom-align">
						<div>
							<div in:maskSlideIn={{ reverse: true }} out:maskSlideOut>
								<p class="paragraph">
									{data[currentActive].details.description}
								</p>
							</div>
						</div>
						<div class="links">
							{#each data[currentActive].links as link}
								<div style="position: relative">
									<a in:letterSlideIn out:letterSlideOut href={link.link} target="_blank" class="button no-decor">{link.text}</a>
									<div class="underline" transition:fade></div>
								</div><br>
							{/each}
							<div class="line" transition:fade></div>
						</div>
						<div class="roles">
							<div class="wrapper">
								<div in:maskSlideIn={{reverse: true}} out:maskSlideOut>
									<p class="descriptor">Keywords</p>
								</div>
								<ul>
									{#each data[currentActive].roles as role, index}
										<li in:maskSlideIn={{reverse: true, delay: index*100}} out:maskSlideOut>{"+ " + role}</li>
									{/each}
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>


<style lang="sass">

\:global(canvas)
	position: absolute
	top: 0
	left: 0
	z-index: -1

@import "../consts.sass"
@include textStyles()

#content-container.work-click-area .content-wrapper
	display: flex
	flex-direction: column
	cursor: grab
	position: relative

	&.disabled
		cursor: default !important

		.mobile ul.work-list
			opacity: 0

	.mobile
		width: 100%
		height: 100%
		overflow-x: auto

	*
		-webkit-touch-callout: none
		-webkit-user-select: none
		-moz-user-select: none
		-ms-user-select: none
		user-select: none

	.details-container
		position: absolute
		left: 0
		top: 0
		height: 100%
		width: 100%
		display: flex
		flex-direction: row
		justify-content: space-between
		box-sizing: border-box
		padding: 0 14vw

		.wrapper
			text-align: left
			position: relative
			display: flex
			flex-direction: column
			justify-content: space-between
			flex-basis: 100%

			.top-align
				.wrapper
					display: flex
					flex-direction: row
					align-items: center
					justify-content: left
					position: relative

					h6.caption
						position: relative
						font-family: $font
						text-transform: uppercase
						font-weight: normal
						font-size: 1.9vh

					.index
						font-family: $font
						position: relative
						font-size: 2.1vh

					span.line
						width: 15%
						margin: 0 1%
						height: 1.5px
						background-color: white

			.mid-align
				display: flex
				flex-direction: row
				align-items: center
				justify-content: space-between

				h1.title
					position: relative
					font-family: $titleFont
					font-size: 3vw
					text-transform: lowercase
					font-weight: normal
					word-wrap: break-word
					white-space: normal
					line-height: 70%

					&.breakTitleWords
						display: inline-block
						max-width: min-content

				.close-button
					cursor: pointer
					font-size: 3.3vw

			@media only screen and (max-width: 750px)
				.mid-align
					flex-direction: column
					justify-content: flex-start
					align-items: flex-start

					h1.title
						font-size: 16.5vw

					.close-button-wrapper
						position: absolute
						top: 0
						right: 0

						.close-button
							font-size: 5vh


			.bottom-align
				display: flex
				flex-direction: row
				justify-content: space-between
				align-items: center

				*
					flex-grow: 1
					flex-basis: 0

				p
					font-size: 1.3vh
					width: 60%

				.roles
					display: flex
					flex-direction: column
					align-items: center

					.descriptor
						line-height: 270%
						letter-spacing: 0.5vh
						font-family: $font
						text-transform: uppercase
						font-weight: normal
						font-size: 1.4vh


					ul
						list-style-type: none
						display: flex
						flex-direction: column

						li
							font-family: $font
							text-transform: uppercase
							font-weight: normal
							font-size: 1.7vh
							line-height: 160%

				.links
					position: relative
					display: flex
					flex-direction: column
					align-items: center

					div.line
						content: ""
						position: absolute
						top: 150%
						left: 50%
						width: 1.2px
						background-color: white
						height: 5vh

					.button
						font-size: 1.3vw
						letter-spacing: 0.2vw
						text-transform: uppercase
						text-decoration: none
						line-height: 160%

					.underline
						display: none

			@media only screen and (max-width: 750px)
				.bottom-align
					flex-direction: column
					justify-content: flex-start
					align-items: flex-start

					p
						font-size: 1.6vh !important

					.links
						margin: 2vh 0
						align-items: flex-start

						.button
							font-size: 2vh
							position: relative

						.underline
							display: inline-block
							position: absolute
							width: 100%
							height: 2px
							bottom: 0
							left: 0
							background-color: white

						div.line
							display: none

	ul.work-list
		margin-top: auto
		margin: auto 0
		padding: 0 5vw
		list-style-type: none
		display: flex
		flex-direction: row
		align-items: center
		height: 75vh
		min-width: min-content
		opacity: 1
		transition: opacity 0.5s ease
		-webkit-transition: opacity 0.5s ease

		&.hold
			.list-item
				height: 45vh !important

		.list-item
			display: inline-flex
			justify-content: flex-end
			overflow: hidden
			height: 55vh
			width: 23vw
			box-sizing: border-box
			position: relative
			overflow: hidden
			z-index: 3
			margin-right: 6vw
			transition: width 0.7s cubic-bezier(0.25, 1, 0.5, 1), height 0.7s cubic-bezier(0.25, 1, 0.5, 1), margin 0.8s cubic-bezier(0.25, 1, 0.5, 1)

			*
				transition: opacity 0.3s ease
				-webkit-transition: opacity 0.3s ease

			&.active
				height: 60vh
				width: 50vw
				margin-right: 16vw
				margin-left: 10vw

				.img-wrapper
					width: 100%

			&.ambient
				height: 45vh

			.hidden
				opacity: 0

			.img-wrapper
				overflow: hidden
				height: 100%
				z-index: 1
				position: relative
				width: 85%
				margin-right: 15%
				box-shadow: 3px 9px 18px rgba(0, 0, 0, 0.2)

				img
					height: 110%
					width: 110%
					object-fit: cover
					position: absolute
					top: 50%
					left: 50%
					transform: translate(-50%, -50%)
					-webkit-transform: translate(-50%, -50%)
					opacity: 0.5

			.scroll-done
				transition: 0.8s opacity ease
				-webkit-transition: 0.8s opacity ease

			.text-top-wrapper
				position: absolute
				top: 6vh
				right: 0
				z-index: 2
				word-wrap: break-word
				white-space: normal
				text-align: right

				.item-index
					font-size: 1vw
					letter-spacing: 0.1vw
					text-transform: uppercase
					font-family: $font

			.text-wrapper
				box-sizing: border-box
				display: flex
				flex-direction: column
				justify-content: flex-end
				position: absolute
				bottom: 10vh
				right: 0
				text-align: right
				z-index: 2

				.button
					font-size: 1.3vw
					letter-spacing: 0.1vw
					margin-top: 2vh
					text-transform: uppercase

				.item-title
					font-family: $font
					font-weight: normal
					font-size: 2vw
					z-index: 0
					opacity: 1
					word-wrap: break-word
					white-space: normal


				.inline-wrapper
					width: 100%
					position: relative
					margin-top: 1vh

					*
						display: inline-block

		@media only screen and (max-width: 1450px)
			.list-item
				width: 25vw

		@media only screen and (max-width: 1110px)
			.list-item
				width: 40vw

				.text-top-wrapper
					.item-index
						font-size: 2vh

				.text-wrapper
					width: calc(55vw - 10vh)

					.item-title
						font-size: 5vw

					.item-link
						font-size: 2vh

		@media only screen and (max-width: 650px)
			.list-item
				width: 75vw

				.text-wrapper
					width: calc(70vw - 10vh)

					.item-title
						font-size: 4.5vh

</style>