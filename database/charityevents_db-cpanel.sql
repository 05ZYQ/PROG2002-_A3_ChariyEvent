-- ================================================================
-- charityevents_db-cpanel.sql
-- phpMyAdmin / cPanel import version of the Kindred City Charity
-- database (schema + data).
--
-- PROG2002 Web Development II - Assessment 3
-- Group: 05ZYQ (1379209835@qq.com) & hahaha135135 (623881354@qq.com)
--
-- HOW TO IMPORT (phpMyAdmin on cPanel):
--   1. cPanel > MySQL Databases: create a database
--      (e.g. cpaneluser_charityevents_db) and a user with
--      ALL PRIVILEGES on it.
--   2. cPanel > phpMyAdmin: click the new database in the left
--      sidebar so it is SELECTED.
--   3. Open the "Import" tab, choose this file, format = SQL,
--      character set = utf8mb4, press "Go".
--
-- NOTE: unlike charityevents_db.sql this file intentionally has NO
-- "CREATE DATABASE" / "USE" statements - cPanel accounts are not
-- allowed to create databases from SQL, the script must run inside
-- the database you selected in phpMyAdmin.
-- Re-importing is safe: existing tables are dropped first.
-- ================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `registration`;
DROP TABLE IF EXISTS `event`;
DROP TABLE IF EXISTS `category`;
DROP TABLE IF EXISTS `organisation`;

-- ----------------------------------------------------------------
-- Table: organisation
-- The charitable organisations that host the events.
-- ----------------------------------------------------------------
CREATE TABLE `organisation` (
  `org_id`         INT NOT NULL AUTO_INCREMENT,
  `org_name`       VARCHAR(120) NOT NULL,
  `org_mission`    VARCHAR(500) NOT NULL,
  `contact_email`  VARCHAR(120) NOT NULL,
  `contact_phone`  VARCHAR(30)  NOT NULL,
  `website`        VARCHAR(160) DEFAULT NULL,
  PRIMARY KEY (`org_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------
-- Table: category
-- Look-up table of event categories (fun run, gala, auction, ...).
-- ----------------------------------------------------------------
CREATE TABLE `category` (
  `category_id`          INT NOT NULL AUTO_INCREMENT,
  `category_name`        VARCHAR(80) NOT NULL,
  `category_description` VARCHAR(300) NOT NULL,
  PRIMARY KEY (`category_id`),
  UNIQUE KEY `uq_category_name` (`category_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------
-- Table: event
-- One row per charity event.
--   is_active    = 0 -> the event is archived / withdrawn
--   is_suspended = 1 -> hidden from the public site pending review
--   latitude / longitude -> used by the Open-Meteo weather API
-- ----------------------------------------------------------------
CREATE TABLE `event` (
  `event_id`         INT NOT NULL AUTO_INCREMENT,
  `org_id`           INT NOT NULL,
  `category_id`      INT NOT NULL,
  `event_name`       VARCHAR(150) NOT NULL,
  `event_description` TEXT NOT NULL,
  `event_date`       DATE NOT NULL,
  `start_time`       TIME NOT NULL,
  `venue`            VARCHAR(150) NOT NULL,
  `location`         VARCHAR(100) NOT NULL,
  `latitude`         DECIMAL(9,6) DEFAULT NULL,
  `longitude`        DECIMAL(9,6) DEFAULT NULL,
  `ticket_price`     DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  `fundraising_goal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `amount_raised`    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `event_image`      VARCHAR(200) DEFAULT NULL,
  `is_active`        TINYINT(1) NOT NULL DEFAULT 1,
  `is_suspended`     TINYINT(1) NOT NULL DEFAULT 0,
  `created_at`       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`event_id`),
  KEY `fk_a3_event_org` (`org_id`),
  KEY `fk_a3_event_category` (`category_id`),
  CONSTRAINT `fk_a3_event_org` FOREIGN KEY (`org_id`) REFERENCES `organisation` (`org_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_a3_event_category` FOREIGN KEY (`category_id`) REFERENCES `category` (`category_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------
-- Table: registration  (NEW in Assessment 3)
-- Records a web user registering for one specific event.
--
-- Relationships
--   registration.event_id -> event.event_id   (many registrations
--                                              belong to one event)
--   UNIQUE uq_registration_event_email        (the same email may
--                                              only register once
--                                              for the same event)
--
-- A separate USER table is deliberately NOT created - the brief
-- states this is out of scope, so the registration row carries the
-- user details directly.
-- ----------------------------------------------------------------
CREATE TABLE `registration` (
  `registration_id`    INT NOT NULL AUTO_INCREMENT,
  `event_id`           INT NOT NULL,
  `full_name`          VARCHAR(120) NOT NULL,
  `email`              VARCHAR(150) NOT NULL,
  `phone`              VARCHAR(30)  NOT NULL,
  `registration_date`  DATE NOT NULL,
  `tickets_purchased`  INT NOT NULL DEFAULT 1,
  `notes`              VARCHAR(300) DEFAULT NULL,
  `created_at`         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`registration_id`),
  KEY `fk_a3_registration_event` (`event_id`),
  UNIQUE KEY `uq_registration_event_email` (`event_id`, `email`),
  CONSTRAINT `fk_a3_registration_event` FOREIGN KEY (`event_id`) REFERENCES `event` (`event_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------
-- Sample data: organisations
-- ----------------------------------------------------------------
INSERT INTO `organisation` (`org_id`, `org_name`, `org_mission`, `contact_email`, `contact_phone`, `website`) VALUES
(1, 'Kindred City Charity', 'Kindred City Charity connects neighbours with local causes, funding food relief, youth mentoring and crisis accommodation across the greater city area.', 'hello@kindredcity.org.au', '(02) 8810 2244', 'www.kindredcity.org.au'),
(2, 'Harbour Youth Trust', 'Harbour Youth Trust runs mentoring, tutoring and employment programs for young people doing it tough.', 'contact@harbouryouth.org.au', '(02) 9955 7781', 'www.harbouryouth.org.au'),
(3, 'Greenline Wildlife Fund', 'Greenline Wildlife Fund protects urban bushland and native wildlife habitats through community-led restoration projects.', 'info@greenlinewildlife.org.au', '(02) 7744 3120', 'www.greenlinewildlife.org.au');

-- ----------------------------------------------------------------
-- Sample data: categories
-- ----------------------------------------------------------------
INSERT INTO `category` (`category_id`, `category_name`, `category_description`) VALUES
(1, 'Fun Run', 'Timed and untimed running events where entry fees are donated to the cause.'),
(2, 'Gala Dinner', 'Formal fundraising dinners with auctions, speeches and entertainment.'),
(3, 'Silent Auction', 'Bid on donated goods and experiences; proceeds go to charity.'),
(4, 'Charity Concert', 'Live music performances raising money for community programs.'),
(5, 'Quiz Night', 'Team trivia evenings with entry fees and prize donations.'),
(6, 'Community Market', 'Stall-holder markets where a share of sales supports the charity.');

-- ----------------------------------------------------------------
-- Sample data: events (12 events, including past + suspended rows)
-- latitude / longitude are the coordinates handed to Open-Meteo.
-- ----------------------------------------------------------------
INSERT INTO `event`
(`event_id`, `org_id`, `category_id`, `event_name`, `event_description`, `event_date`, `start_time`, `venue`, `location`, `latitude`, `longitude`, `ticket_price`, `fundraising_goal`, `amount_raised`, `event_image`, `is_active`, `is_suspended`) VALUES
(1, 1, 1, 'City Sunrise Fun Run 2026', 'A 5 km and 10 km run along the river path at sunrise. Every registration includes a finisher medal and a donated breakfast. Funds raised provide weekly food hampers for families in crisis.', '2026-10-18', '06:30:00', 'Riverside Park Precinct', 'Westport', -33.870800, 151.207300, 45.00, 40000.00, 27350.00, 'funrun.svg', 1, 0),
(2, 2, 2, 'Harbour Youth Gala Night', 'Black-tie dinner with a three-course meal, live string quartet and guest speakers from the mentoring program. All proceeds fund free tutoring for senior students.', '2026-11-07', '19:00:00', 'Grand Pacific Ballroom', 'Eastport', -33.856200, 151.215200, 120.00, 60000.00, 18200.00, 'gala.svg', 1, 0),
(3, 1, 3, 'Spring Silent Auction', 'An evening of silent bidding on art, weekend getaways and restaurant vouchers donated by local businesses. Doors open for viewing from 5 pm, bidding closes at 9 pm.', '2026-10-25', '17:00:00', 'Kindred Community Hall', 'Westport', -33.874500, 151.198900, 15.00, 15000.00, 9400.00, 'auction.svg', 1, 0),
(4, 3, 4, 'Songs for the Bushland Concert', 'An open-air acoustic concert featuring four local bands. Funds support native habitat restoration along the Greenline corridor.', '2026-11-22', '14:00:00', 'Fernhill Amphitheatre', 'Northgate', -33.812100, 151.183400, 35.00, 25000.00, 11260.00, 'concert.svg', 1, 0),
(5, 2, 5, 'Trivia for Tutors Quiz Night', 'Tables of six battle through eight rounds of trivia. Entry includes a cheese platter; bar proceeds are matched dollar-for-dollar by a local sponsor.', '2026-10-30', '18:30:00', 'The Anchor Hotel Function Room', 'Eastport', -33.860100, 151.224700, 20.00, 8000.00, 5150.00, 'quiz.svg', 1, 0),
(6, 1, 6, 'Twilight Community Market', 'An evening market with food trucks, craft stalls and live folk music. Twenty percent of all stall takings go to the crisis accommodation fund.', '2026-12-05', '16:00:00', 'Kindred Square', 'Westport', -33.877000, 151.201500, 5.00, 12000.00, 3100.00, 'market.svg', 1, 0),
(7, 3, 1, 'Wildlife Wander Trail Run', 'A trail run through urban bushland with guided stops to spot native wildlife. Registration includes a native shrub to take home and plant.', '2027-02-14', '07:00:00', 'Greenline Reserve Entry', 'Northgate', -33.806700, 151.176500, 40.00, 30000.00, 4200.00, 'trailrun.svg', 1, 0),
(8, 2, 2, 'New Year Charity Brunch Gala', 'A relaxed daytime gala with sparkling brunch, youth speaker panel and raffle draws throughout the morning. Funds launch the 2027 employment-readiness workshops.', '2027-01-17', '10:00:00', 'Harbourview Terrace', 'City Centre', -33.865200, 151.209100, 85.00, 45000.00, 7800.00, 'brunch.svg', 1, 0),
(9, 1, 4, 'Winter Choir Benefit Evening', 'A choral evening held in the town hall raising funds for the winter blanket drive. The event has now concluded - thank you to everyone who attended.', '2026-08-15', '19:30:00', 'Westport Town Hall', 'Westport', -33.872300, 151.195600, 25.00, 10000.00, 12380.00, 'choir.svg', 1, 0),
(10, 3, 3, 'Coastal Art Auction (Suspended)', 'This event listing has been suspended by the website administrators pending review of the organising partner. It should not appear on any public page.', '2026-12-12', '18:00:00', 'Northgate Arts Centre', 'Northgate', -33.815400, 151.190200, 30.00, 20000.00, 0.00, 'art.svg', 1, 1),
(11, 1, 5, 'Kindred Quiz Championships', 'The end-of-year quiz championship where the winning table takes home the Kindred Cup. Entry includes supper and one raffle ticket.', '2026-11-14', '19:00:00', 'Kindred Community Hall', 'Westport', -33.874500, 151.198900, 18.00, 9000.00, 2260.00, 'quiz.svg', 1, 0),
(12, 2, 6, 'Harbour Makers Market', 'A weekend makers market showcasing young designers from the Harbour Youth Trust program. Stall fees are donated straight back into the mentoring fund.', '2026-10-24', '09:00:00', 'Harbour Promenade', 'Eastport', -33.858900, 151.217800, 0.00, 6000.00, 1480.00, 'market.svg', 1, 0);

-- ----------------------------------------------------------------
-- Sample data: registrations (16 rows spread over several events)
-- The event detail page lists these sorted by registration_date
-- descending, so the newest registration appears first.
-- Event 10 is left with NO registrations on purpose so the
-- "delete blocked / delete allowed" behaviour can be demonstrated.
-- ----------------------------------------------------------------
INSERT INTO `registration`
(`registration_id`, `event_id`, `full_name`, `email`, `phone`, `registration_date`, `tickets_purchased`, `notes`) VALUES
(1,  1, 'Amelia Hart',      'amelia.hart@example.com',      '0412 998 221', '2026-09-02', 2, 'Running with my two teenage sons.'),
(2,  1, 'Devon Ngatai',     'devon.ngatai@example.com',     '0403 771 004', '2026-09-05', 1, 'First fun run - very excited!'),
(3,  1, 'Priya Raman',      'priya.raman@example.com',      '0455 220 118', '2026-09-11', 4, 'Corporate team of four.'),
(4,  1, 'Marcus Bell',      'marcus.bell@example.com',      '0499 334 870', '2026-09-19', 2, NULL),
(5,  2, 'Sofia Marchetti',  'sofia.marchetti@example.com',  '0411 556 732', '2026-09-21', 6, 'Table of six for the Harbour Trust.'),
(6,  2, 'Henry Osei',       'henry.osei@example.com',       '0422 118 907', '2026-09-28', 2, 'Vegetarian meals please.'),
(7,  3, 'Clara Whitfield',  'clara.whitfield@example.com',  '0433 902 445', '2026-10-01', 1, 'Interested in the art lots.'),
(8,  3, 'Tom Ito',          'tom.ito@example.com',          '0477 640 213', '2026-10-03', 3, 'Bringing friends from the Rotary club.'),
(9,  3, 'Nadia Farouk',     'nadia.farouk@example.com',     '0488 213 559', '2026-10-07', 2, NULL),
(10, 4, 'Liam Kessell',     'liam.kessell@example.com',     '0401 887 330', '2026-10-08', 5, 'Group booking - please seat together.'),
(11, 4, 'Grace Tui',        'grace.tui@example.com',        '0450 771 926', '2026-10-10', 2, NULL),
(12, 5, 'Ethan Brooks',     'ethan.brooks@example.com',     '0414 556 118', '2026-10-12', 6, 'Full table of six.'),
(13, 9, 'Hannah Lowe',      'hannah.lowe@example.com',      '0425 690 774', '2026-07-20', 2, 'Attended - loved the choir.'),
(14, 9, 'Ravi Shankar',     'ravi.shankar@example.com',     '0436 118 402', '2026-07-28', 1, NULL),
(15, 11, 'Mia Sullivan',    'mia.sullivan@example.com',     '0466 902 331', '2026-10-13', 4, 'Defending quiz champions.'),
(16, 12, 'Jonah Reilly',    'jonah.reilly@example.com',     '0490 447 215', '2026-10-14', 1, 'Stall holder - early setup please.');

SET FOREIGN_KEY_CHECKS = 1;
