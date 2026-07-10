alter table profiles drop column if exists aura_balance;
alter table profiles drop column if exists prediction_points;

alter table vibes drop column if exists starting_price;
alter table vibes drop column if exists buy_now_price;
alter table vibes drop column if exists end_time;
alter table vibes drop column if exists duration;
