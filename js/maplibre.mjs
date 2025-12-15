// @ts-check
import "./maplibre-gl.js";

const lineColors = {
    inactive: "rgb(93 107 137 / 50%)",
    active: "rgb(249 115 22)",
};
const lineWidths = {
    inactive: 2,
    active: 5,
};
const pointColors = {
    inactive: lineColors.inactive,
    active: lineColors.active,
};
const pointRadii = {
    inactive: 5,
    active: 8,
};

/**
 * @param {string} id
 */
function getTimelineItem(id) {
    return document.querySelector(`div.timeline-item[data-l-id="${id}"]`);
}

function getTimelineItems() {
    return document.querySelectorAll("div.timeline-item");
}

/**
 * @typedef {Object} TransportationItem
 * @property {string} id
 * @property {number} lat1
 * @property {number} lat2
 * @property {number} lon1
 * @property {number} lon2
 * @property {GeoJSON.GeoJSON | null} track
 */
/**
 * @typedef {Object} VisitItem
 * @property {string} id
 * @property {number} lat
 * @property {number} lon
 */
/**
 * @typedef {Object} AccommodationsItem
 * @property {string} id
 * @property {number} lat
 * @property {number} lon
 */

function rebuildNitroxData() {
    /**
     * @type { TransportationItem[] }
     */
    const transportations = [];
    /**
     * @type { VisitItem []}
     */
    const visits = [];
    /**
     * @type { AccommodationsItem []}
     */
    const accommodations = [];

    const ts = document.querySelectorAll("div.timeline-item[data-l-type='transportation']");
    for (const t of ts) {
        const id = t.getAttribute("data-l-id");
        if (id == null) {
            continue;
        }

        const loc = t.querySelector(".location-info");
        if (loc == null) {
            continue;
        }
        const attrLat1 = loc.getAttribute("data-l-origin-lat");
        const attrLat2 = loc.getAttribute("data-l-dest-lat");
        const attrLon1 = loc.getAttribute("data-l-origin-lon");
        const attrLon2 = loc.getAttribute("data-l-dest-lon");
        if (attrLat1 == null || attrLat2 == null || attrLon1 == null || attrLon2 == null) {
            continue;
        }

        const lat1 = parseFloat(attrLat1);
        const lat2 = parseFloat(attrLat2);
        const lon1 = parseFloat(attrLon1);
        const lon2 = parseFloat(attrLon2);

        const trackData = t.querySelector(".track-data");
        let track = null;
        if (trackData != null) {
            try {
                const geoJson = trackData.getAttribute("data-track");
                if (geoJson != null) {
                    track = JSON.parse(geoJson);
                }
            } catch (e) {}
        }

        transportations.push({
            id,
            lat1,
            lat2,
            lon1,
            lon2,
            track,
        });
    }
    const vs = document.querySelectorAll("div.timeline-item[data-l-type='visit']");
    for (const v of vs) {
        const id = v.getAttribute("data-l-id");
        if (id == null) {
            continue;
        }
        const loc = v.querySelector(".location-info");
        if (loc == null) {
            continue;
        }

        const attrLat = loc.getAttribute("data-l-lat");
        const attrLon = loc.getAttribute("data-l-lon");
        if (attrLat == null || attrLon == null) {
            continue;
        }

        const lat = parseFloat(attrLat);
        const lon = parseFloat(attrLon);

        visits.push({ id, lat, lon });
    }

    const accs = document.querySelectorAll("div.timeline-item[data-l-type='accommodations']");
    for (const a of accs) {
        const id = a.getAttribute("data-l-id");
        if (id == null) {
            continue;
        }
        const loc = a.querySelector(".location-info");
        if (loc == null) {
            continue;
        }

        const attrLat = loc.getAttribute("data-l-lat");
        const attrLon = loc.getAttribute("data-l-lon");
        if (attrLat == null || attrLon == null) {
            continue;
        }

        const lat = parseFloat(attrLat);
        const lon = parseFloat(attrLon);

        accommodations.push({ id, lat, lon });
    }

    return {
        transportations,
        visits,
        accommodations,
    };
}

class NitroxController {
    /**
     * @param {Element | null} element
     */
    activateTimelineItem(element) {
        const items = getTimelineItems();

        for (const i of items) {
            i.classList.remove("active");

            const type = i.getAttribute("data-l-type");
            const id = i.getAttribute("data-l-id");
            if (type == null || id == null) {
                continue;
            }
            if (type === "transportation") {
                this.inactivateLine(id);
            } else if (type === "visit") {
                this.inactivatePoint(id);
            } else if (type === "accommodations") {
                this.inactivatePoint(id);
            }
        }

        if (element != null) {
            element.classList.add("active");

            const type = element.getAttribute("data-l-type");
            const id = element.getAttribute("data-l-id");
            if (type != null && id != null) {
                if (type === "transportation") {
                    this.activateLine(id);
                } else if (type === "visit") {
                    this.activatePoint(id);
                } else if (type === "accommodations") {
                    this.activatePoint(id);
                }
            }
        }
    }

    /**
     * @param {string} id
     */
    activateTimelineItemById(id) {
        const item = getTimelineItem(id);

        this.activateTimelineItem(item);
    }

    /**
     * @param {string} id
     * @param {number} lat1
     * @param {number} lon1
     * @param {number} lat2
     * @param {number} lon2
     */
    addLine(id, lat1, lon1, lat2, lon2) {
        this.map.addSource(id, {
            type: "geojson",
            data: {
                type: "Feature",
                properties: {},
                geometry: {
                    type: "LineString",
                    coordinates: [
                        [lon1, lat1],
                        [lon2, lat2],
                    ],
                },
            },
        });

        // @ts-ignore
        this.bounds[id] = new maplibregl.LngLatBounds(
            [Math.min(lon1, lon2), Math.min(lat1, lat2)],
            [Math.max(lon1, lon2), Math.max(lat1, lat2)],
        );

        this.map.addLayer({
            id,
            type: "line",
            source: id,
            layout: {
                "line-join": "round",
                "line-cap": "round",
            },
            paint: {
                "line-color": lineColors.inactive,
                "line-width": lineWidths.inactive,
            },
        });
    }

    /**
     * @param {string} id
     * @param {GeoJSON.GeoJSON} geoJson
     */
    addGeoJson(id, geoJson) {
        this.map.addSource(id, {
            type: "geojson",
            data: geoJson,
        });

        // @ts-ignore
        const bb = new maplibregl.LngLatBounds();
        // @ts-ignore
        for (const coord of geoJson.geometry.coordinates) {
            bb.extend(coord);
        }
        this.bounds[id] = bb;

        this.map.addLayer({
            id,
            type: "line",
            source: id,
            layout: {
                "line-join": "round",
                "line-cap": "round",
            },
            paint: {
                "line-color": lineColors.inactive,
                "line-width": lineWidths.inactive,
            },
        });
    }

    /**
     * @param {string} id
     * @param {number} lat
     * @param {number} lon
     */
    addPoint(id, lat, lon) {
        this.map.addSource(id, {
            type: "geojson",
            data: {
                type: "Feature",
                properties: {},
                geometry: {
                    type: "Point",
                    coordinates: [lon, lat],
                },
            },
        });

        this.map.addLayer({
            id,
            type: "circle",
            source: id,
            paint: {
                "circle-color": pointColors.inactive,
                "circle-radius": pointRadii.inactive,
            },
        });
    }

    /**
     * @param {string} id
     */
    activateLine(id) {
        this.map.setPaintProperty(id, "line-color", lineColors.active);
        this.map.setPaintProperty(id, "line-width", lineWidths.active);

        this.map.moveLayer(id);

        const t = this.getTransportationById(id);
        if (t != null) {
            this.map.fitBounds(this.bounds[id], {
                padding: { bottom: 40, top: 40, left: 30, right: 30 },
                speed: 2,
            });
        }
    }
    /**
     * @param {string} id
     */
    inactivateLine(id) {
        this.map.setPaintProperty(id, "line-color", lineColors.inactive);
        this.map.setPaintProperty(id, "line-width", lineWidths.inactive);
    }

    /**
     * @param {string} id
     */
    activatePoint(id) {
        this.map.setPaintProperty(id, "circle-color", pointColors.active);
        this.map.setPaintProperty(id, "circle-radius", pointRadii.active);

        this.map.moveLayer(id);

        const v = this.getVisitById(id);
        if (v != null) {
            this.map.flyTo({
                center: [v.lon, v.lat],
                zoom: 13,
            });
        } else {
            const a = this.getAccommodationsById(id);
            if (a != null) {
                this.map.flyTo({
                    center: [a.lon, a.lat],
                    zoom: 13,
                });
            }
        }
    }
    /**
     * @param {string} id
     */
    inactivatePoint(id) {
        this.map.setPaintProperty(id, "circle-color", pointColors.inactive);
        this.map.setPaintProperty(id, "circle-radius", pointRadii.inactive);
    }

    /**
     *
     * @param {string} id
     * @returns
     */
    getTransportationById(id) {
        return this.transportations.find((t) => t.id === id);
    }
    /**
     *
     * @param {string} id
     * @returns
     */
    getVisitById(id) {
        return this.visits.find((v) => v.id === id);
    }
    /**
     *
     * @param {string} id
     * @returns
     */
    getAccommodationsById(id) {
        return this.accommodations.find((a) => a.id === id);
    }

    /**
     * @param {string} containerId
     * @param {TransportationItem[]} transportations
     * @param {VisitItem[]} visits
     * @param {AccommodationsItem[]} accommodations
     */
    constructor(containerId, transportations, visits, accommodations) {
        this.transportations = transportations;
        this.visits = visits;
        this.accommodations = accommodations;

        /**
         * @type {Record<string, maplibregl.LngLatBounds>}
         */
        this.bounds = {};

        // @ts-ignore
        this.map = new maplibregl.Map({
            container: containerId,
            style: "https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json",
            center: [139.781111, 35.553333],
            zoom: 10,
            maplibreLogo: true,
        });

        this.map.on("load", () => {
            for (const t of transportations) {
                if (t.track != null) {
                    this.addGeoJson(t.id, t.track);
                } else {
                    this.addLine(t.id, t.lat1, t.lon1, t.lat2, t.lon2);
                }
            }
            for (const v of visits) {
                this.addPoint(v.id, v.lat, v.lon);
            }
            for (const a of accommodations) {
                this.addPoint(a.id, a.lat, a.lon);
            }

            const observer = new IntersectionObserver(
                (entries) => {
                    for (const e of entries) {
                        if (e.isIntersecting) {
                            this.activateTimelineItem(e.target);
                        }
                    }
                },
                {
                    rootMargin: "-45% 0px -45% 0px",
                },
            );

            const items = getTimelineItems();
            for (const i of items) {
                observer.observe(i);
                i.addEventListener("click", () => {
                    i.scrollIntoView({ behavior: "smooth", block: "center" });
                    this.activateTimelineItem(i);
                });
            }
        });
    }
}

/**
 *
 * @param {string} containerId
 */
export function initMap(containerId) {
    const { transportations, visits, accommodations } = rebuildNitroxData();

    const controller = new NitroxController(containerId, transportations, visits, accommodations);
}
