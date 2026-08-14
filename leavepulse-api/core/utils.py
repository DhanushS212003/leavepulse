from datetime import date


def get_current_financial_year():
    today = date.today()

    if today.month >= 4:
        return f"{today.year}-{str(today.year + 1)[-2:]}"
    else:
        return f"{today.year - 1}-{str(today.year)[-2:]}"


def calculate_leave_count(days, joined_date=None):
    if joined_date:
        today = joined_date
    else:
        today = date.today()

    month = today.month

    if month >= 4:
        remaining_months = 16 - month
    else:
        remaining_months = 4 - month

    return (round((days / 12) * remaining_months))
