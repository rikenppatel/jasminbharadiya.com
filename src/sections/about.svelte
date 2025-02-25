<script lang="ts">

import { onMount } from "svelte";
import { letterSlideIn, maskSlideIn } from "../animations";
import { aboutAnchor, loadPagePromise, slickScrollInstance, firstName, capitalize } from "../store";
import { loadImage } from "../utils";

// DOM Node binds
let aboutSection1Container, aboutSection2Container;
let githubLink, emailLink;
let profilePicContainer;
let title, paragraph, profilePicture;

// Promise which when resolved will trigger svelte animations
let section2InViewResolve;
let section2InViewPromise = new Promise((resolve) => section2InViewResolve = resolve);
const CapitalizedFirstName = capitalize(firstName);

onMount(async () => {
	// Wait for page to load
	await loadPagePromise;
	// Set navbar about link's y location to top of aboutContainer
	$aboutAnchor = aboutSection1Container;

	// Add parallax scrolling offsets to slickScroll
	$slickScrollInstance.addOffset({
		element: profilePicContainer,
		speedY: 0.8
	});

	section2IntroAnimations();
	section1IntroAnimations();
});



// About section
function section1IntroAnimations() {

	// Scroll activated animations powered by anime instead of svelte transitions
	const titleAnimate = letterSlideIn(title, { delay: 15 });
	const paragraphAnimate = maskSlideIn(paragraph, { duration: 1000, delay: 200 });
	const link1Animate = maskSlideIn(emailLink, { delay: 400 });
	const link2Animate = maskSlideIn(githubLink, { delay: 700 });
	const profilePictureAnimate = maskSlideIn(profilePicture, { duration: 1200,
		maskStyles: [
			{ property: "width", value: "100%"},
			{ property: "height", value: "100%"}
		]
	});

	// Run animations when intersection obeserver detects aboutSection1Container to be in scroll view
	let observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {

				titleAnimate.anime();
				paragraphAnimate.anime();
				link1Animate.anime();
				link2Animate.anime();
				profilePictureAnimate.anime("easeInOutQuint");

				observer.disconnect();
			}
		});
	}, { root: null, threshold: 0.4 });

	observer.observe(aboutSection1Container);
}

// Skills and awards section
function section2IntroAnimations() {
	// Resolve animations promise when intersection obeserver detects aboutSection2Container to be in scroll view
	let observer = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				section2InViewResolve();

				observer.disconnect();
			}
		});
	}, { root: null, threshold: 0.4 });

	observer.observe(aboutSection2Container);
}

</script>

<div id="content-container" class="about" bind:this={aboutSection1Container}>
	<div class="content-wrapper">
		<h1 class="title" bind:this={title}>
			the name's<br>{$CapitalizedFirstName}
		</h1>
		<div bind:this={paragraph}>
			<p class="paragraph">
				I'm an innovative researcher in the field of MLOps, with a keen interest in exploring the latest developments in artificial intelligence, machine learning, and algorithms. <br><br> I'm also an accomplished speaker and an advocate for the responsible use of technology. <br><br>
				I'm passionate about inspiring young women and minorities to pursue careers in technology and has served as a mentor to numerous students throughout her career.
			</p>
		</div>
		<div class="social-button-wrapper">
			<div bind:this={emailLink}>
				<span class="button"><a href="mailto:jasminbharadiya92@gmail.com" target="_blank" class="clickable sublink link">Email Me</a></span>
			</div>
			<div bind:this={githubLink}>
				<span class="button" bind:this={githubLink}><a href="https://orcid.org/0009-0002-4264-6005" target="_blank" class="clickable sublink link">Checkout my latest Research</a></span>
			</div>
			<div bind:this={githubLink}>
				<span class="button" bind:this={githubLink}><a href="https://medium.com/@jasminbharadiya" target="_blank" class="clickable sublink link">I write blogs on Medium</a></span>
			</div>
		</div>
	</div>
	<div class="profile-image" bind:this={profilePicContainer}>
		{#await loadImage("assets/imgs/profile-photo.jpg") then src}
			<img src="{src}" bind:this={profilePicture} alt="Jasmin's Cover" class="profile-pic">
		{/await}
	</div>
</div>

<div class="horizontal-flex" bind:this={aboutSection2Container}>
	{#await section2InViewPromise then _}
		<ul class="list first">
			<li class="list-title">
				<div in:letterSlideIn={{ initDelay: 400 }}>
					Stuff i use a lot
				</div>
			</li>
			<li>
				<div in:letterSlideIn={{ initDelay: 550 }}>
					Front-end
				</div>
				<div
					class="flex-item"
					in:maskSlideIn={{ delay: 600 }}>
					<img src="assets/imgs/svg-icons/angular.svg" alt="angular">
					<img src="assets/imgs/svg-icons/svelte.svg" alt="svelte">
				</div>
			</li>
			<li>
				<div in:letterSlideIn={{ initDelay: 650 }}>
					Mobile
				</div>
				<div class="flex-item" in:maskSlideIn={{ delay: 700 }}>
					<img src="assets/imgs/svg-icons/flutter.svg" alt="flutter">
					<img src="assets/imgs/svg-icons/android.svg" alt="native android">
					<img src="assets/imgs/svg-icons/iOS.svg" alt="native ios">
				</div>
			</li>
			<li>
				<div in:letterSlideIn={{ initDelay: 750 }}>
					Back-end
				</div>
				<div class="flex-item" in:maskSlideIn={{ delay: 800 }}>
					<img src="assets/imgs/svg-icons/firebase.svg" alt="firebase">
					<img src="assets/imgs/svg-icons/nodejs.svg" alt="node js">
					<img src="assets/imgs/svg-icons/php.svg" alt="php">
					<img src="assets/imgs/svg-icons/mysql.svg" alt="mySQL">
				</div>
			</li>
			<li>
				<div in:letterSlideIn={{ initDelay: 850 }}>
					Design
				</div>
				<div class="flex-item"
					in:maskSlideIn={{ delay: 900 }}>
					<img src="assets/imgs/svg-icons/illustrator.svg" alt="adobe illustrator">
					<img src="assets/imgs/svg-icons/xd.svg" alt="adobe xd">
				</div>
			</li>
		</ul>
		<ul class="list">
			<li class="list-title">
				<div in:letterSlideIn={{ initDelay: 400 }}>
					awards
				</div>
			</li>
			<li>
				<div in:letterSlideIn={{ initDelay: 550 }}>
					1x — Awwwards Honors
				</div>
			</li>
		</ul>
	{/await}
</div>


<style lang="sass">

@import "../consts.sass"
@include textStyles()

#content-container.about
	display: flex
	flex-direction: row
	justify-content: space-between
	overflow: hidden
	padding: 0 5vw
	margin-top: 40vh
	position: relative
	padding-bottom: 5vh

	.profile-image
		width: 70%
		overflow: hidden
		margin-top: -30vh
		position: relative

		img
			height: 80%
			width: 90%
			border-radius: 0.5vh
			object-fit: cover

	.content-wrapper
		box-sizing: border-box
		width: 50%
		height: 100%
		margin: 0 2vw
		padding-right: 4vw
		display: flex
		flex-direction: column
		justify-content: center
		margin-top: 5vh
		box-sizing: border-box
		z-index: 2

		@media only screen and (max-width: 750px)
			&
				width: 80%

				h1
					font-size: 25vw !important

		h1
			font-size: 20vh
			font-weight: 400

		.paragraph
			margin-top: 10vh
			margin-left: 13vw
			position: relative
			width: 60%
			line-height: 1.5rem

			@media only screen and (max-width: 750px)
				&
					width: 100%
					margin-left: 5vw

			&::before
				content: ""
				position: absolute
				height: 1px
				width: 10vw
				right: 115%
				top: 15%
				background-color: white


		.social-button-wrapper
			font-size: 3vh
			margin-left: 13vw
			margin-top: 4vh
			display: inline-block

			& :global(*:not(:last-child))
				margin-right: 2vw

			@media only screen and (max-width: 750px)
				&
					margin-left: 5vw


	@media only screen and (max-width: 950px)
		.right-container
			margin-top: 3vh
			justify-content: flex-start !important

		.profile-image
			display: none

.horizontal-flex
	display: flex
	flex-direction: row
	justify-content: space-between
	padding: 0 13vw
	margin-top: 12vh
	width: 100%
	box-sizing: border-box

	@media only screen and (max-width: 1080px)
		flex-direction: column
		padding: 0 8vw

	.list
		list-style-type: none
		text-align: left

		@media only screen and (max-width: 1080px)
			margin-top: 10vh

		li.list-title
			letter-spacing: 0.6vh
			font-size: 1.3vh
			font-weight: bold

		li
			font-family: $font
			text-transform: uppercase
			font-size: 2vh
			letter-spacing: 0.5vh
			padding: 2vh 0
			border-bottom: 1px solid #444
			display: flex
			flex-wrap: wrap
			flex-direction: row
			justify-content: space-between
			align-items: center
			column-gap: 5vw
			row-gap: 3vh

			img
				height: 2.3vh

</style>