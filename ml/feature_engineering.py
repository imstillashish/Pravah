"""
Feature engineering module for BDRY time-series forecasting.
"""
import pandas as pd


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Adds time-series lag, rolling statistics, and temporal features to the input DataFrame.

    Added Columns:
    - lag_7: 7-day lag of close price
    - lag_14: 14-day lag of close price
    - lag_30: 30-day lag of close price
    - rolling_mean_14: 14-day rolling mean of close price
    - rolling_std_14: 14-day rolling standard deviation of close price
    - rolling_mean_30: 30-day rolling mean of close price
    - month: integer month (1-12)
    - quarter: integer quarter (1-4)
    """
    out_df = df.copy()

    # Determine close price column name
    if "Close" in out_df.columns:
        close_col = "Close"
    elif "close" in out_df.columns:
        close_col = "close"
    elif "Adj Close" in out_df.columns:
        close_col = "Adj Close"
    else:
        raise KeyError("DataFrame must contain a 'Close' or 'close' column.")

    close_series = out_df[close_col]

    # Calculate Lags
    out_df["lag_7"] = close_series.shift(7)
    out_df["lag_14"] = close_series.shift(14)
    out_df["lag_30"] = close_series.shift(30)

    # Calculate Rolling Statistics
    out_df["rolling_mean_14"] = close_series.rolling(window=14).mean()
    out_df["rolling_std_14"] = close_series.rolling(window=14).std()
    out_df["rolling_mean_30"] = close_series.rolling(window=30).mean()

    # Determine Date column or index for month and quarter
    if "Date" in out_df.columns:
        date_series = pd.to_datetime(out_df["Date"])
    elif "date" in out_df.columns:
        date_series = pd.to_datetime(out_df["date"])
    elif isinstance(out_df.index, pd.DatetimeIndex):
        date_series = pd.Series(out_df.index, index=out_df.index)
    else:
        date_series = pd.to_datetime(out_df.index)

    out_df["month"] = date_series.dt.month.astype(int)
    out_df["quarter"] = date_series.dt.quarter.astype(int)

    return out_df


def apply_walk_forward_split(df: pd.DataFrame, test_size: int = 60) -> tuple:
    """
    Splits the DataFrame into train and test sets in chronological order (walk-forward split).
    Enforces shuffle=False and asserts that the test set's first date is after the train set's last date.

    Args:
        df (pd.DataFrame): Input DataFrame containing time-series data.
        test_size (int): Number of rows in the test set. Default is 60.

    Returns:
        tuple: (train_df, test_df)
    """
    if len(df) <= test_size:
        raise ValueError(f"DataFrame length ({len(df)}) must be greater than test_size ({test_size}).")

    train_df = df.iloc[:-test_size].copy()
    test_df = df.iloc[-test_size:].copy()

    # Extract dates for chronological verification
    if "Date" in df.columns:
        train_last_date = pd.to_datetime(train_df["Date"].iloc[-1])
        test_first_date = pd.to_datetime(test_df["Date"].iloc[0])
    elif "date" in df.columns:
        train_last_date = pd.to_datetime(train_df["date"].iloc[-1])
        test_first_date = pd.to_datetime(test_df["date"].iloc[0])
    elif isinstance(df.index, pd.DatetimeIndex):
        train_last_date = train_df.index[-1]
        test_first_date = test_df.index[0]
    else:
        train_last_date = pd.to_datetime(train_df.index[-1])
        test_first_date = pd.to_datetime(test_df.index[0])

    assert test_first_date > train_last_date, (
        f"Chronological split assertion failed: Test set's first date ({test_first_date}) "
        f"must be strictly after train set's last date ({train_last_date}). "
        "Data may be shuffled or not sorted chronologically."
    )

    return train_df, test_df

