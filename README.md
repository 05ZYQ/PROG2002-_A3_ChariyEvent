# Kindred City Charity - A3 Complete Dynamic Website

A complete dynamic website (client-side + admin-side) for a fictional non-profit
organisation, **Kindred City Charity**, built for **PROG2002 Web Development II -
Assessment 3**.

**Team:** 05ZYQ (1379209835@qq.com) &amp; hahaha135135 (623881354@qq.com)

Both websites are developed with the **AngularJS** framework (bonus requirement) and
improved with the **external Open-Meteo weather API** (bonus requirement).

## What is new compared with Assessment 2

| Area | A2 | A3 |
|------|----|----|
| Framework | Plain JS/DOM | **AngularJS 1.8** (client + admin) |
| Registration | "Under construction" dialog | Full registration page + `registration` table |
| Event detail | Details only | Details + registration list (latest first) + weather forecast |
| Admin site | none | 6-page staff dashboard with full C.R.U.D. |
| API | 4 read-only endpoints | 18 endpoints incl. full CRUD + weather proxy |
| Database | 3 tables | 4 tables (new `registration`, event gains lat/lon) |
| External API | none | Open-Meteo forecast via `/api/weather` |
| Pages | 3 | **13** (7 public + 6 admin) |

## Tech stack

- **Database:** MySQL (`charityevents_db`) - schema + data in one export file
- **Server:** Node.js (developed and tested on **Node 18.20.8**) + ExpressJS RESTful API
- **Client:** AngularJS 1.8.3, HTML, CSS (vendored locally in `vendor/`)
- **External API:** [Open-Meteo](https://open-meteo.com) weather forecast (free, no key)

## Project structure

```
.
├── api/
│   ├── event_db.js               # MySQL connection pool + query helpers
│   ├── app.js                    # Express server, static hosting, router mounting
│   ├── routes/
│   │   ├── events.js             # event read + full CRUD (incl. delete-blocked rule)
│   │   ├── categories.js         # category read + CRUD (delete blocked while in use)
│   │   ├── organisations.js      # read-only organisation list
│   │   ├── registrations.js      # registration feature (new in A3)
│   │   ├── stats.js              # admin dashboard statistics
│   │   └── weather.js            # Open-Meteo proxy + weather code translation
│   └── package.json
├── clientside/                   # public website (AngularJS)
│   ├── index.html                # Home - organisation info + upcoming events
│   ├── events.html               # Browse & search (date / location / category)
│   ├── event.html                # Event details + registrations + weather
│   ├── register.html             # NEW registration page (form + validation)
│   ├── categories.html           # Category listing + drill-down
│   ├── about.html                # About the partner organisations
│   ├── contact.html              # Contact details from the API
│   ├── css/site.css               # shared stylesheet
│   ├── vendor/angular.min.js      # AngularJS 1.8.3 (local copy, no CDN needed)
│   └── js/                        # app module, services, one controller per page
├── adminside/                    # staff website (AngularJS)
│   ├── index.html                # Dashboard (live stats + latest registrations)
│   ├── events.html               # List ALL events (Active/Past/Suspended) + delete
│   ├── new-event.html            # Create events (validated form)
│   ├── edit-event.html           # Update events + view their registrations
│   ├── registrations.html        # All registrations, filter + delete
│   ├── categories.html           # Category management (extra CRUD)
│   └── js/                        # admin module, AdminApi service, controllers
└── database/
    └── charityevents_db.sql      # complete schema + sample data (single file)
```

## Getting started

### 1. Create the database

Import the SQL export into MySQL (Workbench: File > Open SQL Script > Run, or):

```bash
mysql -u root -p < database/charityevents_db.sql
```

### 2. Configure the connection

Open `api/event_db.js` and set `user` / `password` for your local MySQL server, or
export the environment variables `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

### 3. Install and run (Node.js 18+)

```bash
cd api
npm install
npm start
```

### 4. Open the websites

| Website | URL |
|---------|-----|
| Public site | <http://localhost:3030> |
| Admin site | <http://localhost:3030/admin> |
| API welcome | <http://localhost:3030/> (JSON) |

## API endpoints (18)

### Events
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET    | `/api/events` | ALL events incl. past/suspended (admin) |
| GET    | `/api/events/upcoming` | active, upcoming events (home page) |
| GET    | `/api/events/filter` | search by `date`, `location`, `category` |
| GET    | `/api/events/:id` | event details **+ registrations (latest first)** |
| POST   | `/api/events` | insert a new event (admin) |
| PUT    | `/api/events/:id` | update an event (admin) |
| DELETE | `/api/events/:id` | delete (blocked with 409 while registrations exist) |

### Registrations
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET    | `/api/registrations` | all registrations, `?event_id=` filter |
| POST   | `/api/registrations` | register for an event (unique email per event) |
| DELETE | `/api/registrations/:id` | remove a registration (admin) |

### Categories / Organisations
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET    | `/api/categories` | categories with event counts |
| POST   | `/api/categories` | create a category |
| PUT    | `/api/categories/:id` | update a category |
| DELETE | `/api/categories/:id` | delete (blocked while events use it) |
| GET    | `/api/organisations` | hosting organisations |

### Dashboard & external API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET    | `/api/stats` | live statistics for the admin dashboard |
| GET    | `/api/weather?lat=&lon=` | Open-Meteo 7-day forecast proxy |

Example weather call: `GET /api/weather?lat=-33.87&lon=151.21`

## Database design

- `organisation` - hosts the events (1 : N)
- `category` - look-up table (1 : N)
- `event` - gained `latitude` / `longitude` columns for the weather API
- `registration` (**new**) - `registration_id` PK, `event_id` FK, user details,
  `registration_date`, `tickets_purchased`, `notes` and
  `UNIQUE (event_id, email)` enforcing "one registration per person per event"
  (a person may still register for many different events).

## Team contribution

- **05ZYQ** - database schema & data export, Express server core, events CRUD,
  categories CRUD, client website (home, browse/search, event detail pages).
- **hahaha135135** - registration feature (API + public page), Open-Meteo weather
  integration (proxy + widgets), admin website (dashboard, list/create/update/delete
  events, registrations, categories).

## Features checklist (assessment requirements)

- [x] New `registration` table with PK/FK + UNIQUE constraint, 16 sample registrations
- [x] Event detail endpoint returns event + registrations sorted by latest purchase date
- [x] POST / PUT / DELETE endpoints for events; deletion blocked while registrations exist
- [x] Public event detail page shows the registration list (latest first)
- [x] Register button links to the new registration page (event id via query string)
- [x] Registration page: event info, validated form, confirmation message
- [x] Admin website: list (all statuses), new, update (+ registrations view), delete
- [x] Admin navigation menu present on every page
- [x] External Open-Meteo weather API integrated (server proxy + event page widget)
- [x] Both sites built with AngularJS (bonus)
- [x] 13 pages in total; all data retrieved live through the API
