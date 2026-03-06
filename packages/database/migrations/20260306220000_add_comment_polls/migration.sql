-- CreateTable
CREATE TABLE "CommentPoll" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "closesAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentPoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentPollOption" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "CommentPollOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentPollVote" (
    "id" TEXT NOT NULL,
    "pollId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentPollVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommentPoll_commentId_key" ON "CommentPoll"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "CommentPollVote_userId_pollId_key" ON "CommentPollVote"("userId", "pollId");

-- AddForeignKey
ALTER TABLE "CommentPoll" ADD CONSTRAINT "CommentPoll_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentPollOption" ADD CONSTRAINT "CommentPollOption_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "CommentPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentPollVote" ADD CONSTRAINT "CommentPollVote_pollId_fkey" FOREIGN KEY ("pollId") REFERENCES "CommentPoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentPollVote" ADD CONSTRAINT "CommentPollVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "CommentPollOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentPollVote" ADD CONSTRAINT "CommentPollVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
