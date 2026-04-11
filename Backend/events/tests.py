from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import FeedbackPost


class FeedbackReplyTests(APITestCase):
	def setUp(self):
		self.url = reverse('events:feedback-list-create')

	def test_can_create_reply_with_parent_id(self):
		root = FeedbackPost.objects.create(
			nickname='Root',
			avatar_color='#111111',
			title='',
			content='Top-level message',
		)

		response = self.client.post(
			self.url,
			{
				'nickname': 'Replier',
				'content': 'This is a reply',
				'parent_id': root.id,
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(response.data['parent_id'], root.id)

		reply = FeedbackPost.objects.get(id=response.data['id'])
		self.assertEqual(reply.parent_id, root.id)

	def test_get_feedback_returns_top_level_posts_with_replies(self):
		root = FeedbackPost.objects.create(
			nickname='Root',
			avatar_color='#111111',
			title='',
			content='Top-level message',
		)
		FeedbackPost.objects.create(
			parent=root,
			nickname='Reply',
			avatar_color='#222222',
			title='',
			content='Child message',
		)

		response = self.client.get(self.url)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['count'], 1)
		self.assertEqual(len(response.data['posts']), 1)
		self.assertEqual(len(response.data['posts'][0]['replies']), 1)
		self.assertEqual(response.data['posts'][0]['replies'][0]['content'], 'Child message')

	def test_invalid_parent_id_returns_error(self):
		response = self.client.post(
			self.url,
			{
				'content': 'bad parent',
				'parent_id': 999999,
			},
			format='json',
		)

		self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
