/**
 * Renders the whole application in the browser.
 *
 * Every piece of state the app owns - favourites, user recipes, the meal plan -
 * lives in `localStorage`, and all recipe data is fetched straight from
 * TheMealDB by the browser. There is no server-side data to render, so server
 * rendering would only produce an empty shell that the client immediately
 * replaces. Turning it off instead lets `npm run build` emit a folder of static
 * files that any static host can serve. See README > Assumptions.
 */
export const ssr = false;
export const prerender = false;
