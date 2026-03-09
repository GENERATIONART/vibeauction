-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    reputation FLOAT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Auction status enum
CREATE TYPE auction_status AS ENUM ('draft', 'active', 'completed', 'cancelled');

-- Auctions table
CREATE TABLE auctions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    starting_price NUMERIC(10,2) NOT NULL,
    current_price NUMERIC(10,2) DEFAULT NULL,
    min_increment NUMERIC(10,2) DEFAULT 1.00,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ NOT NULL,
    status auction_status DEFAULT 'draft',
    featured BOOLEAN DEFAULT FALSE,
    image_urls TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bids table
CREATE TABLE bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auction_id UUID REFERENCES auctions(id),
    bidder_id UUID REFERENCES users(id),
    amount NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_max_bid BOOLEAN DEFAULT FALSE,
    max_bid_limit NUMERIC(10,2)
);

-- User Ratings table
CREATE TABLE user_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rated_user_id UUID REFERENCES users(id),
    rater_user_id UUID REFERENCES users(id),
    auction_id UUID REFERENCES auctions(id),
    rating INT CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(rated_user_id, rater_user_id, auction_id)
);

-- Indexes for performance
CREATE INDEX idx_auctions_seller ON auctions(seller_id);
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_bids_auction ON bids(auction_id);
CREATE INDEX idx_bids_bidder ON bids(bidder_id);

-- Trigger to update auction's current price when a new bid is inserted
CREATE OR REPLACE FUNCTION update_auction_price()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auctions
    SET current_price = NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.auction_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_auction_price_trigger
AFTER INSERT ON bids
FOR EACH ROW
EXECUTE FUNCTION update_auction_price();