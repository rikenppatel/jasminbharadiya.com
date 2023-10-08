import { writable, derived, get } from "svelte/store";

let fetchJsonData = (sourceFile: string) => new Promise(async (resolve: (data: any[]) => void) => {
    let data = await (await fetch(sourceFile)).json();
    resolve(data);
});

export let slickScrollInstance = writable(null); // Instance of slickscroll

export let isWorkScroll = writable(false); // Is work slider being scrolled
export let workScrollSpeed = writable(0); // Speed of work slider for use with Threejs effects

export let isMobile = writable(false); // Is client a phone

// Navigation anchors
export let homeAnchor = writable(null);
export let workAnchor = writable(null);
export let aboutAnchor = writable(null);

export const firstName: Writable<string> = writable("jasmin");
export const lastName: Writable<string> = writable("bharadiya");

export let imgPromises = writable([]); // Array of asynchronous image promises
export let loadPageResolve;
export let loadPagePromise = new Promise((resolve) => loadPageResolve = resolve);
export let loaderAnimationResolve;
export let loaderAnimationPromise = new Promise((resolve) => loaderAnimationResolve = resolve);

export function capitalize(store) {
    return derived(store, $value => {
        const capitalized = ($value as string).charAt(0).toUpperCase() + ($value as string).slice(1);
        return capitalized;
    });
}

// Fetch work data from the work-data.json file
export const workItemsFetch = fetchJsonData("work-data.json");
// Fetch other data from the data.json file
export const dataFetch = fetchJsonData("data.json");

// Store for holding API data
export const listItemsFetch = writable({ lists: [], details: [] });

export const fetchMediumListsFromAPI = async () => {
    try {
        const requestOptions = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': '9622a20d53mshc25209c92c62db2p15a5c8jsnbab3e1e34dc6' // Replace with your actual API key
            },
            redirect: 'follow'
        };

        const response = await fetch("https://medium2.p.rapidapi.com/user/d30494e3b290/lists", requestOptions);

        if (!response.ok) {
            throw new Error("Network response was not ok: " + response.statusText);
        }

        const data = await response.json();
        console.log("medium lists ids::::: ", data)

        listItemsFetch.set(data); // Set the fetched data to the listItemsFetch store
    } catch (error) {
        console.error("There has been a problem with your fetch operation:", error);
    }
};

export const fetchListDetails = async (listId) => {
    try {
        const options = {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': '9622a20d53mshc25209c92c62db2p15a5c8jsnbab3e1e34dc6',
                'X-RapidAPI-Host': 'medium2.p.rapidapi.com'
            }
        };

        const response = await fetch(`https://medium2.p.rapidapi.com/list/${listId}`, options);

        if (!response.ok) {
            throw new Error("Network response was not ok: " + response.statusText);
        }

        return await response.json();
    } catch (error) {
        console.error("There has been a problem with your fetch operation:", error);
    }
};

export const fetchAllListDetails = async (lists) => {
    try {
        const detailsPromises = lists.map(listId => fetchListDetails(listId));
        const details = await Promise.all(detailsPromises);
        listItemsFetch.update(current => ({ ...current, details }));
        console.log("List Items detail :::::", listItemsFetch)
    } catch (error) {
        console.error("There has been a problem with fetching all list details:", error);
    }
};

// export const articlesIDsFetch = writable([]);
// export const articlesDetailsFetch = writable([]);

// export const fetchMediumArticlesFromAPI = async () => {
//     try {
//         const requestOptions = {
//             method: 'GET',
//             headers: {
//                 'x-rapidapi-key': '9622a20d53mshc25209c92c62db2p15a5c8jsnbab3e1e34dc6' // Replace with your actual API key
//             },
//             redirect: 'follow'
//         };

//         const response = await fetch("https://medium2.p.rapidapi.com/user/d30494e3b290/articles", requestOptions);

//         if (!response.ok) {
//             throw new Error("Network response was not ok: " + response.statusText);
//         }

//         const data = await response.json();
//         console.log("medium lists ids::::: ", data)

//         articlesIDsFetch.set(data.associated_articles);
//     } catch (error) {
//         console.error("There has been a problem with your fetch operation:", error);
//     }
// };

// export const fetchArticleDetails = async (articleId) => {
//     try {
//         const response = await fetch(` https://medium2.p.rapidapi.com/article/${articleId}`);
//         if (!response.ok) {
//             throw new Error("Network response was not ok: " + response.statusText);
//         }
//         return await response.json();
//     } catch (error) {
//         console.error("Error fetching article details:", error);
//     }
// };

// export const fetchAllArticleDetails = async () => {
//     const articleIDs = get(articlesIDsFetch); // Get current value of article IDs
//     try {
//         // Get only the last 3 article IDs
//         const lastThreeArticleIDs = articleIDs.slice(-1);

//         // Fetch details for each of the last 3 articles
//         const detailsPromises = lastThreeArticleIDs.map(id => fetchArticleDetails(id));
//         const details = await Promise.all(detailsPromises);

//         // Set the fetched details to the articlesDetailsFetch store
//         articlesDetailsFetch.set(details);
//     } catch (error) {
//         console.error("Error fetching all article details:", error);
//     }
// };


type OriginalResponse = {
    id: string;
    tags: string[];
    claps: number;
    last_modified_at: string;
    published_at: string;
    url: string;
    image_url: string;
    lang: string;
    publication_id: string;
    word_count: number;
    title: string;
    reading_time: number;
    responses_count: number;
    voters: number;
    topics: string[];
    author: string;
    subtitle: string;
};

type ParsedResponse = {
    id: string;
    title: string;
    details: {
        description: string;
        summary: string;
    };
    date: string;
    roles: string[];
    links: {
        type: string;
        text: string;
        link: string;
    }[];
    image_url: string;
};

// export const articlesItemsFetch = writable<ParsedResponse[]>([]);
export const articlesItemsFetch = writable([]);

const parseArticleResponse = (response: OriginalResponse): ParsedResponse => {
    const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long' };
    const date = new Date(response.published_at).toLocaleDateString('en-US', dateOptions);

    return {
        id: response.id,
        title: response.title,
        details: {
            description: response.subtitle,
            summary: response.title
        },
        date: date,
        roles: response.tags,
        links: [
            {
                type: "web",
                text: "Read More",
                link: response.url
            }
        ],
        image_url: response.image_url
    };
};

export const fetchMediumArticlesFromAPI = async () => {
    try {
        const requestOptions = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': '9622a20d53mshc25209c92c62db2p15a5c8jsnbab3e1e34dc6' // Replace with your actual API key
            },
            redirect: 'follow'
        };

        const response = await fetch("https://medium2.p.rapidapi.com/user/d30494e3b290/articles", requestOptions);

        if (!response.ok) {
            throw new Error("Network response was not ok: " + response.statusText);
        }

        const data = await response.json();
        const reverseData = data.associated_articles.reverse()
        const articleIds = reverseData.slice(-20); // Get the last 3 article ids

        const articleDetailsPromises = articleIds.map((id: string) => fetchArticleDetails(id));
        const articleDetails = await Promise.all(articleDetailsPromises);

        console.log(articleDetails.map((detail: OriginalResponse) => parseArticleResponse(detail)).reverse())
        articlesItemsFetch.set(articleDetails.map((detail: OriginalResponse) => parseArticleResponse(detail)).reverse());
    } catch (error) {
        console.error("There has been a problem with your fetch operation:", error);
    }
};

const fetchArticleDetails = async (articleId: string): Promise<OriginalResponse> => {
    try {
        const requestOptions = {
            method: 'GET',
            headers: {
                'x-rapidapi-key': '9622a20d53mshc25209c92c62db2p15a5c8jsnbab3e1e34dc6' // Replace with your actual API key
            },
            redirect: 'follow'
        };

        const response = await fetch(`https://medium2.p.rapidapi.com/article/${articleId}`, requestOptions);

        if (!response.ok) {
            throw new Error("Network response was not ok: " + response.statusText);
        }

        return await response.json();
    } catch (error) {
        console.error("There has been a problem with your fetch operation:", error);
        throw error;
    }
};