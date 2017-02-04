import os
import channels.asgi

# Asgi file setup for production
# https://blog.heroku.com/in_deep_with_django_channels_the_future_of_real_time_apps_in_django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "simulacra.settings")
channel_layer = channels.asgi.get_channel_layer()